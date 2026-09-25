import hashlib
import hmac
import json
import os
import urllib.request
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.tsc_platform import TscPayment
from app.services.wallet_service import (
    get_wallet_by_user,
    create_transaction,
)


PAYSTACK_URL = "https://api.paystack.co"


def _request_paystack(
    method: str,
    path: str,
    payload: dict | None = None,
):
    secret = os.getenv(
        "PAYSTACK_SECRET_KEY"
    )

    if not secret:
        raise ValueError(
            "PAYSTACK_SECRET_KEY is not configured"
        )

    body = None

    headers = {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
    }

    if payload is not None:
        body = json.dumps(
            payload
        ).encode("utf-8")

    request = urllib.request.Request(
        f"{PAYSTACK_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=30,
        ) as response:
            return json.loads(
                response.read()
            )
    except Exception as exc:
        raise ValueError(
            f"Paystack request failed: {exc}"
        )


def initialize_wallet_payment(
    db: Session,
    user_id: int,
    amount: float,
    currency: str = "NGN",
    callback_url: str | None = None,
):
    if amount < 100 or amount > 10000:
        raise ValueError(
            "Recharge amount must be between ₦100 and ₦10,000"
        )

    currency = currency.upper()

    if currency != "NGN":
        raise ValueError(
            "Wallet recharge currently supports NGN"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ValueError(
            "User not found"
        )

    reference = (
        f"TSC-WALLET-{uuid4().hex[:20].upper()}"
    )

    payment = TscPayment(
        user_id=user_id,
        amount=amount,
        currency=currency,
        reference=reference,
        status="pending",
        provider="paystack",
    )

    db.add(payment)
    db.flush()

    payload = {
        "email": user.email,
        "amount": str(
            int(round(amount * 100))
        ),
        "currency": currency,
        "reference": reference,
        "channels": [
            "card",
            "bank_transfer",
            "ussd",
            "qr",
        ],
        "metadata": json.dumps(
            {
                "user_id": user_id,
                "wallet_recharge": True,
            }
        ),
    }

    configured_callback = (
        callback_url
        or os.getenv(
            "PAYSTACK_CALLBACK_URL"
        )
    )

    if configured_callback:
        payload["callback_url"] = (
            configured_callback
        )

    result = _request_paystack(
        "POST",
        "/transaction/initialize",
        payload,
    )

    if not result.get("status"):
        raise ValueError(
            result.get(
                "message",
                "Paystack initialization failed",
            )
        )

    data = result.get("data") or {}

    payment.authorization_url = data.get(
        "authorization_url"
    )
    payment.access_code = data.get(
        "access_code"
    )
    payment.provider_reference = data.get(
        "reference"
    )
    payment.raw_response = json.dumps(
        result
    )

    db.commit()
    db.refresh(payment)

    return {
        "reference": payment.reference,
        "authorization_url": payment.authorization_url,
        "access_code": payment.access_code,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
    }


def settle_payment(
    db: Session,
    reference: str,
    provider_response: dict | None = None,
):
    payment = (
        db.query(TscPayment)
        .filter(
            TscPayment.reference
            == reference
        )
        .with_for_update()
        .first()
    )

    if not payment:
        raise ValueError(
            "Payment not found"
        )

    if payment.status == "success":
        return payment

    payment.status = "success"

    if provider_response is not None:
        payment.raw_response = json.dumps(
            provider_response
        )

        provider_data = (
            provider_response.get("data")
            or {}
        )

        payment.provider_reference = (
            provider_data.get(
                "reference"
            )
            or payment.provider_reference
        )

    wallet = get_wallet_by_user(
        db,
        payment.user_id,
    )

    wallet.balance = (
        wallet.balance or 0
    ) + payment.amount

    create_transaction(
        db=db,
        user_id=payment.user_id,
        wallet_id=wallet.id,
        amount=payment.amount,
        transaction_type="wallet_recharge",
        status="completed",
        reference=payment.reference,
    )

    db.commit()
    db.refresh(payment)

    return payment


def verify_wallet_payment(
    db: Session,
    reference: str,
):
    result = _request_paystack(
        "GET",
        f"/transaction/verify/{reference}",
    )

    data = result.get("data") or {}

    status = data.get("status")

    if status == "success":
        payment = settle_payment(
            db,
            reference,
            result,
        )
    else:
        payment = (
            db.query(TscPayment)
            .filter(
                TscPayment.reference
                == reference
            )
            .first()
        )

        if payment:
            payment.status = (
                status or "pending"
            )
            payment.raw_response = (
                json.dumps(result)
            )
            db.commit()
            db.refresh(payment)

    return {
        "reference": reference,
        "status": status,
        "payment": payment,
        "provider_response": result,
    }


def verify_webhook_signature(
    raw_body: bytes,
    signature: str,
):
    secret = os.getenv(
        "PAYSTACK_SECRET_KEY"
    )

    if not secret:
        return False

    expected = hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(
        expected,
        signature,
    )
