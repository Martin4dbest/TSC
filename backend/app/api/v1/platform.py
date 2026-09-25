from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from sqlalchemy.orm import Session
import json

from app.db.session import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_admin,
)
from app.models.user import User
from app.models.tsc_platform import (
    TscSafetyPolicy,
    TscClaim,
    TscResponder,
    TscPartner,
    TscFxRate,
    TscPayment,
)
from app.schemas.tsc_platform import (
    TripRequestCreate,
    AdminTripReview,
    SafetyPolicyCreate,
    SafetyPolicyUpdate,
    ClaimCreate,
    ClaimReview,
    ResponderCreate,
    PartnerCreate,
    DispatchCreate,
    FxRateCreate,
    FxConvertRequest,
    WalletPaymentInitialize,
)
from app.services.tsc_platform_service import (
    request_trip,
    get_user_trip_workflows,
    get_user_trip,
    admin_list_trips,
    admin_live_trips,
    review_trip,
    activate_trip_from_workflow,
    ensure_default_policy,
    create_claim,
    list_user_claims,
    review_claim,
    create_responder,
    list_responders,
    create_dispatch,
    create_partner,
    list_partners,
    create_fx_rate,
    convert_currency,
    trip_ai_snapshot,
)
from app.services.tsc_payment_service import (
    initialize_wallet_payment,
    verify_wallet_payment,
    verify_webhook_signature,
    settle_payment,
)


router = APIRouter(
    prefix="/platform",
    tags=["TSC Platform"],
)


@router.post("/trips/request")
def create_trip_request(
    payload: TripRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return request_trip(
            db=db,
            user_id=current_user.id,
            start_location=payload.start_location,
            destination=payload.destination,
            start_latitude=payload.start_latitude,
            start_longitude=payload.start_longitude,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/trips/me")
def my_platform_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_trip_workflows(
        db,
        current_user.id,
    )


@router.get("/trips/{trip_id}")
def get_platform_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = get_user_trip(
        db,
        current_user.id,
        trip_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    return result


@router.post("/trips/{trip_id}/activate")
def activate_platform_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        activation = activate_trip_from_workflow(
            db=db,
            user_id=current_user.id,
            trip_id=trip_id,
        )

        return {
            "status": "active",
            "activation_id": activation.id,
            "reference": activation.activation_reference,
            "fee": activation.fee,
            "expires_at": activation.expires_at,
            "coverage_details": activation.coverage_details,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/safety-policies")
def available_safety_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_default_policy(db)

    rows = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.enabled == True
        )
        .order_by(
            TscSafetyPolicy.id.asc()
        )
        .all()
    )

    return rows


@router.post("/wallet/paystack/initialize")
def initialize_wallet(
    payload: WalletPaymentInitialize,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return initialize_wallet_payment(
            db=db,
            user_id=current_user.id,
            amount=payload.amount,
            currency=payload.currency,
            callback_url=payload.callback_url,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/wallet/paystack/verify/{reference}"
)
def verify_wallet(
    reference: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = verify_wallet_payment(
            db=db,
            reference=reference,
        )

        payment = result.get("payment")

        if (
            payment
            and payment.user_id
            != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="Payment does not belong to this user",
            )

        return {
            "reference": reference,
            "status": result["status"],
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.post(
    "/wallet/paystack/webhook"
)
async def paystack_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    raw_body = await request.body()

    signature = request.headers.get(
        "x-paystack-signature",
        "",
    )

    if not verify_webhook_signature(
        raw_body,
        signature,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Paystack signature",
        )

    try:
        event = json.loads(
            raw_body.decode("utf-8")
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload",
        )

    event_type = event.get("event")

    if event_type == "charge.success":
        data = event.get("data") or {}
        reference = data.get(
            "reference"
        )

        if reference:
            settle_payment(
                db,
                reference,
                event,
            )

    return {
        "received": True
    }


@router.post("/claims")
def submit_claim(
    payload: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_claim(
            db=db,
            user_id=current_user.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/claims/me")
def my_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_claims(
        db,
        current_user.id,
    )


@router.post("/fx/convert")
def fx_convert(
    payload: FxConvertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return convert_currency(
            db=db,
            amount=payload.amount,
            base_currency=payload.base_currency,
            quote_currency=payload.quote_currency,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# =========================
# ADMIN
# =========================

@router.get("/admin/trips")
def admin_trips(
    status: str | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_list_trips(
        db,
        status=status,
    )


@router.get("/admin/trips/live")
def admin_live(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_live_trips(db)


@router.post(
    "/admin/trips/{trip_id}/review"
)
def admin_review_trip(
    trip_id: int,
    payload: AdminTripReview,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return review_trip(
            db=db,
            trip_id=trip_id,
            admin_id=admin.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/admin/safety-policies"
)
def admin_safety_policies(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ensure_default_policy(db)

    return (
        db.query(TscSafetyPolicy)
        .order_by(
            TscSafetyPolicy.id.asc()
        )
        .all()
    )


@router.post(
    "/admin/safety-policies"
)
def admin_create_safety_policy(
    payload: SafetyPolicyCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.name
            == payload.name
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Safety policy name already exists",
        )

    policy = TscSafetyPolicy(
        **payload.model_dump(),
        created_by=admin.id,
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return policy


@router.patch(
    "/admin/safety-policies/{policy_id}"
)
def admin_update_safety_policy(
    policy_id: int,
    payload: SafetyPolicyUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    policy = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.id
            == policy_id
        )
        .first()
    )

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Safety policy not found",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    for key, value in updates.items():
        setattr(
            policy,
            key,
            value,
        )

    db.commit()
    db.refresh(policy)

    return policy


@router.get("/admin/payments")
def admin_payments(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(TscPayment)
        .order_by(
            TscPayment.id.desc()
        )
        .limit(500)
        .all()
    )


@router.get("/admin/claims")
def admin_claims(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(TscClaim)
        .order_by(
            TscClaim.id.desc()
        )
        .all()
    )


@router.post(
    "/admin/claims/{claim_id}/review"
)
def admin_review_claim(
    claim_id: int,
    payload: ClaimReview,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return review_claim(
            db=db,
            claim_id=claim_id,
            admin_id=admin.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/admin/responders"
)
def admin_responders(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return list_responders(db)


@router.post(
    "/admin/responders"
)
def admin_create_responder(
    payload: ResponderCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return create_responder(
        db,
        payload,
    )


@router.post(
    "/admin/emergency/dispatch"
)
def admin_dispatch_responder(
    payload: DispatchCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return create_dispatch(
            db,
            payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/admin/partners"
)
def admin_partners(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return list_partners(db)


@router.post(
    "/admin/partners"
)
def admin_create_partner(
    payload: PartnerCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return create_partner(
        db,
        payload,
    )


@router.post(
    "/admin/fx"
)
def admin_create_fx(
    payload: FxRateCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return create_fx_rate(
        db,
        payload,
    )


@router.get(
    "/admin/ai/trip/{trip_id}"
)
def admin_ai_trip(
    trip_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        return trip_ai_snapshot(
            db,
            trip_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )


@router.delete(
    "/admin/partners/{partner_id}",
    status_code=204,
)
def admin_delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    from app.models.tsc_platform import TscPartner

    partner = (
        db.query(TscPartner)
        .filter(TscPartner.id == partner_id)
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=404,
            detail="Partner not found",
        )

    db.delete(partner)
    db.commit()
    return None
