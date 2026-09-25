from datetime import datetime, timedelta
from math import floor
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.safety_activation import TripSafetyActivation

from app.models.tsc_platform import (
    TscSafetyPolicy,
    TscTripWorkflow,
    TscTripBilling,
    TscClaim,
    TscResponder,
    TscDispatch,
    TscPartner,
    TscFxRate,
)

from app.services.wallet_service import (
    get_wallet_by_user,
    create_transaction,
)


def ensure_default_policy(db: Session):
    existing = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.name == "Standard Safety"
        )
        .first()
    )

    if existing:
        return existing

    policy = TscSafetyPolicy(
        name="Standard Safety",
        billing_mode="per_trip",
        trip_price=500.0,
        per_km_rate=0.0,
        min_charge=0.0,
        max_charge=10000.0,
        currency="NGN",
        coverage_limit=500000.0,
        duration_hours=24,
        coverage_details=(
            "Trip monitoring, emergency alerts, "
            "accident assistance and emergency response."
        ),
        enabled=True,
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return policy


def request_trip(
    db: Session,
    user_id: int,
    start_location: str,
    destination: str,
    start_latitude=None,
    start_longitude=None,
):
    trip = Trip(
        user_id=user_id,
        start_location=start_location,
        destination=destination,
        start_latitude=start_latitude,
        start_longitude=start_longitude,
        status="draft",
        started_at=None,
        distance_km=0,
        duration_minutes=0,
        average_speed=0,
        safety_score=100,
        risk_level="SAFE",
    )

    db.add(trip)
    db.flush()

    workflow = TscTripWorkflow(
        trip_id=trip.id,
        user_id=user_id,
        status="requested",
    )

    db.add(workflow)

    db.commit()

    db.refresh(trip)
    db.refresh(workflow)

    return serialize_trip(trip, workflow)


def serialize_trip(
    trip: Trip,
    workflow: TscTripWorkflow,
    user: User | None = None,
    policy: TscSafetyPolicy | None = None,
):
    return {
        "id": trip.id,
        "user_id": trip.user_id,
        "user_name": (
            user.full_name
            if user
            else None
        ),
        "user_email": (
            user.email
            if user
            else None
        ),
        "start_location": trip.start_location,
        "destination": trip.destination,
        "start_latitude": trip.start_latitude,
        "start_longitude": trip.start_longitude,
        "current_latitude": trip.current_latitude,
        "current_longitude": trip.current_longitude,
        "distance_km": trip.distance_km or 0,
        "duration_minutes": trip.duration_minutes or 0,
        "average_speed": trip.average_speed or 0,
        "safety_score": trip.safety_score,
        "risk_level": trip.risk_level,
        "trip_status": trip.status,
        "workflow_status": workflow.status,
        "policy_id": workflow.policy_id,
        "policy_name": (
            policy.name
            if policy
            else None
        ),
        "billing_mode": (
            policy.billing_mode
            if policy
            else None
        ),
        "quoted_trip_price": workflow.quoted_trip_price,
        "quoted_per_km_rate": workflow.quoted_per_km_rate,
        "quoted_min_charge": workflow.quoted_min_charge,
        "quoted_max_charge": workflow.quoted_max_charge,
        "quoted_currency": workflow.quoted_currency,
        "quoted_coverage_limit": workflow.quoted_coverage_limit,
        "coverage_details": (
            policy.coverage_details
            if policy
            else None
        ),
        "requested_at": workflow.requested_at,
        "reviewed_at": workflow.reviewed_at,
        "quote_expires_at": workflow.quote_expires_at,
        "admin_notes": workflow.admin_notes,
        "started_at": trip.started_at,
        "ended_at": trip.ended_at,
    }


def get_user_trip_workflows(
    db: Session,
    user_id: int,
):
    rows = (
        db.query(
            TscTripWorkflow,
            Trip,
            TscSafetyPolicy,
        )
        .join(
            Trip,
            Trip.id == TscTripWorkflow.trip_id,
        )
        .outerjoin(
            TscSafetyPolicy,
            TscSafetyPolicy.id
            == TscTripWorkflow.policy_id,
        )
        .filter(
            TscTripWorkflow.user_id == user_id
        )
        .order_by(
            TscTripWorkflow.id.desc()
        )
        .all()
    )

    return [
        serialize_trip(
            trip,
            workflow,
            policy=policy,
        )
        for workflow, trip, policy in rows
    ]


def get_user_trip(
    db: Session,
    user_id: int,
    trip_id: int,
):
    row = (
        db.query(
            TscTripWorkflow,
            Trip,
            TscSafetyPolicy,
        )
        .join(
            Trip,
            Trip.id == TscTripWorkflow.trip_id,
        )
        .outerjoin(
            TscSafetyPolicy,
            TscSafetyPolicy.id
            == TscTripWorkflow.policy_id,
        )
        .filter(
            TscTripWorkflow.user_id == user_id,
            Trip.id == trip_id,
        )
        .first()
    )

    if not row:
        return None

    workflow, trip, policy = row

    return serialize_trip(
        trip,
        workflow,
        policy=policy,
    )


def admin_list_trips(
    db: Session,
    status: str | None = None,
):
    query = (
        db.query(
            TscTripWorkflow,
            Trip,
            User,
            TscSafetyPolicy,
        )
        .join(
            Trip,
            Trip.id == TscTripWorkflow.trip_id,
        )
        .join(
            User,
            User.id == TscTripWorkflow.user_id,
        )
        .outerjoin(
            TscSafetyPolicy,
            TscSafetyPolicy.id
            == TscTripWorkflow.policy_id,
        )
    )

    if status:
        query = query.filter(
            TscTripWorkflow.status == status
        )

    rows = (
        query
        .order_by(
            TscTripWorkflow.id.desc()
        )
        .all()
    )

    return [
        serialize_trip(
            trip,
            workflow,
            user=user,
            policy=policy,
        )
        for workflow, trip, user, policy in rows
    ]


def admin_live_trips(
    db: Session,
):
    rows = (
        db.query(
            TscTripWorkflow,
            Trip,
            User,
            TscSafetyPolicy,
        )
        .join(
            Trip,
            Trip.id == TscTripWorkflow.trip_id,
        )
        .join(
            User,
            User.id == TscTripWorkflow.user_id,
        )
        .outerjoin(
            TscSafetyPolicy,
            TscSafetyPolicy.id
            == TscTripWorkflow.policy_id,
        )
        .filter(
            Trip.status == "ongoing",
        )
        .order_by(
            Trip.updated_at.desc()
        )
        .all()
    )

    return [
        serialize_trip(
            trip,
            workflow,
            user=user,
            policy=policy,
        )
        for workflow, trip, user, policy in rows
    ]


def review_trip(
    db: Session,
    trip_id: int,
    admin_id: int,
    payload,
):
    workflow = (
        db.query(TscTripWorkflow)
        .filter(
            TscTripWorkflow.trip_id == trip_id
        )
        .first()
    )

    if not workflow:
        raise ValueError("Trip request not found")

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise ValueError("Trip not found")

    now = datetime.utcnow()

    workflow.reviewed_at = now
    workflow.reviewed_by = admin_id
    workflow.admin_notes = payload.admin_notes

    if payload.status == "rejected":
        workflow.status = "rejected"

        db.commit()

        return serialize_trip(
            trip,
            workflow,
        )

    if not payload.policy_id:
        raise ValueError(
            "Safety policy is required for approval"
        )

    policy = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.id
            == payload.policy_id,
            TscSafetyPolicy.enabled == True,
        )
        .first()
    )

    if not policy:
        raise ValueError(
            "Enabled safety policy not found"
        )

    trip_price = (
        payload.trip_price
        if payload.trip_price is not None
        else policy.trip_price
    )

    per_km_rate = (
        payload.per_km_rate
        if payload.per_km_rate is not None
        else policy.per_km_rate
    )

    min_charge = (
        payload.min_charge
        if payload.min_charge is not None
        else policy.min_charge
    )

    max_charge = (
        payload.max_charge
        if payload.max_charge is not None
        else policy.max_charge
    )

    if (
        policy.billing_mode == "per_trip"
        and trip_price <= 0
    ):
        raise ValueError(
            "Per-trip policy requires a trip price"
        )

    if (
        policy.billing_mode == "per_km"
        and per_km_rate <= 0
    ):
        raise ValueError(
            "Per-km policy requires a per-km rate"
        )

    if max_charge and min_charge > max_charge:
        raise ValueError(
            "Minimum charge cannot exceed maximum charge"
        )

    workflow.status = "approved"
    workflow.policy_id = policy.id
    workflow.quoted_trip_price = trip_price
    workflow.quoted_per_km_rate = per_km_rate
    workflow.quoted_min_charge = min_charge
    workflow.quoted_max_charge = max_charge
    workflow.quoted_currency = policy.currency
    workflow.quoted_coverage_limit = (
        payload.coverage_limit
        if payload.coverage_limit is not None
        else policy.coverage_limit
    )
    workflow.quote_expires_at = (
        now + timedelta(hours=24)
    )

    db.commit()
    db.refresh(workflow)

    return serialize_trip(
        trip,
        workflow,
        policy=policy,
    )


def activate_trip_from_workflow(
    db: Session,
    user_id: int,
    trip_id: int,
):
    workflow = (
        db.query(TscTripWorkflow)
        .filter(
            TscTripWorkflow.trip_id == trip_id,
            TscTripWorkflow.user_id == user_id,
        )
        .first()
    )

    if not workflow:
        raise ValueError(
            "Trip safety approval not found"
        )

    if workflow.status not in (
        "approved",
        "activated",
    ):
        raise ValueError(
            "Trip has not been approved by Admin"
        )

    if (
        workflow.quote_expires_at
        and workflow.quote_expires_at
        <= datetime.utcnow()
    ):
        raise ValueError(
            "Trip safety approval has expired"
        )

    policy = (
        db.query(TscSafetyPolicy)
        .filter(
            TscSafetyPolicy.id
            == workflow.policy_id
        )
        .first()
    )

    if not policy:
        raise ValueError(
            "Safety policy not found"
        )

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id,
            Trip.user_id == user_id,
        )
        .first()
    )

    if not trip:
        raise ValueError("Trip not found")

    existing = (
        db.query(TripSafetyActivation)
        .filter(
            TripSafetyActivation.trip_id
            == trip_id
        )
        .first()
    )

    if existing and existing.status == "active":
        return existing

    now = datetime.utcnow()
    wallet = get_wallet_by_user(
        db,
        user_id,
    )

    charge = 0.0

    if policy.billing_mode == "per_trip":
        charge = float(
            workflow.quoted_trip_price or 0
        )

        if (
            wallet.balance or 0
        ) < charge:
            raise ValueError(
                "Insufficient wallet balance. "
                f"Required: {charge:.2f}"
            )

        wallet.balance -= charge

    activation = (
        existing
        or TripSafetyActivation(
            trip_id=trip_id,
            user_id=user_id,
        )
    )

    activation.status = "active"
    activation.plan = policy.name
    activation.fee = charge
    activation.activation_reference = (
        f"TSC-SA-{uuid4().hex[:20].upper()}"
    )
    activation.activated_at = now
    activation.expires_at = (
        now
        + timedelta(
            hours=policy.duration_hours
        )
    )

    billing_summary = (
        f"Billing mode: {policy.billing_mode}. "
        f"Currency: {policy.currency}. "
    )

    if policy.billing_mode == "per_km":
        billing_summary += (
            f"Rate: {workflow.quoted_per_km_rate or policy.per_km_rate:.2f} "
            f"per km. "
            f"Minimum: {workflow.quoted_min_charge or policy.min_charge:.2f}. "
            f"Maximum: {workflow.quoted_max_charge or policy.max_charge:.2f}."
        )

    activation.coverage_details = (
        f"{policy.coverage_details or ''} "
        f"{billing_summary}"
    )

    db.add(activation)

    if policy.billing_mode == "per_trip" and charge > 0:
        create_transaction(
            db=db,
            user_id=user_id,
            wallet_id=wallet.id,
            amount=charge,
            transaction_type="debit",
            status="completed",
            reference=activation.activation_reference,
        )

    billing = (
        db.query(TscTripBilling)
        .filter(
            TscTripBilling.trip_id == trip_id
        )
        .first()
    )

    if not billing:
        billing = TscTripBilling(
            trip_id=trip_id,
            user_id=user_id,
        )

    billing.billing_mode = policy.billing_mode
    billing.currency = policy.currency
    billing.unit_price = (
        workflow.quoted_per_km_rate
        if workflow.quoted_per_km_rate is not None
        else policy.per_km_rate
    )
    billing.minimum_charge = (
        workflow.quoted_min_charge
        if workflow.quoted_min_charge is not None
        else policy.min_charge
    )
    billing.maximum_charge = (
        workflow.quoted_max_charge
        if workflow.quoted_max_charge is not None
        else policy.max_charge
    )

    if policy.billing_mode == "per_trip":
        billing.amount_charged = charge
        billing.status = "active"
    else:
        billing.status = "active"

    db.add(billing)

    workflow.status = "activated"

    db.commit()
    db.refresh(activation)

    return activation


def bill_trip_distance(
    db: Session,
    trip: Trip,
    distance_delta: float,
):
    if distance_delta <= 0:
        return

    billing = (
        db.query(TscTripBilling)
        .filter(
            TscTripBilling.trip_id == trip.id
        )
        .first()
    )

    if not billing:
        return

    if billing.billing_mode != "per_km":
        return

    if billing.status not in (
        "active",
        "wallet_insufficient",
    ):
        return

    unit_price = billing.unit_price or 0.0

    if unit_price <= 0:
        return

    current_whole_km = floor(
        max(
            0.0,
            trip.distance_km or 0.0,
        )
    )

    already_billed = floor(
        max(
            0.0,
            billing.billed_km or 0.0,
        )
    )

    new_units = (
        current_whole_km
        - already_billed
    )

    if new_units <= 0:
        return

    requested_charge = (
        new_units * unit_price
    )

    max_charge = (
        billing.maximum_charge or 0.0
    )

    if max_charge > 0:
        remaining_cap = max_charge - (
            billing.amount_charged or 0.0
        )

        if remaining_cap <= 0:
            billing.status = "capped"
            return

        requested_charge = min(
            requested_charge,
            remaining_cap,
        )

    if requested_charge <= 0:
        billing.status = "capped"
        return

    wallet = get_wallet_by_user(
        db,
        trip.user_id,
    )

    available = wallet.balance or 0.0

    if available < requested_charge:
        billing.status = "wallet_insufficient"
        return

    wallet.balance -= requested_charge

    reference = (
        f"TSC-KM-{trip.id}-"
        f"{uuid4().hex[:14].upper()}"
    )

    create_transaction(
        db=db,
        user_id=trip.user_id,
        wallet_id=wallet.id,
        amount=requested_charge,
        transaction_type="trip_km_debit",
        status="completed",
        reference=reference,
    )

    billing.billed_km = (
        already_billed
        + (
            requested_charge
            / unit_price
        )
    )

    billing.amount_charged = (
        billing.amount_charged or 0
    ) + requested_charge

    if (
        max_charge > 0
        and billing.amount_charged >= max_charge
    ):
        billing.status = "capped"
    else:
        billing.status = "active"


def create_claim(
    db: Session,
    user_id: int,
    payload,
):
    trip = (
        db.query(Trip)
        .filter(
            Trip.id == payload.trip_id,
            Trip.user_id == user_id,
        )
        .first()
    )

    if not trip:
        raise ValueError(
            "Trip not found"
        )

    if trip.status not in (
        "ongoing",
        "completed",
    ):
        raise ValueError(
            "A claim can only be created for an active or completed trip"
        )

    claim = TscClaim(
        user_id=user_id,
        trip_id=payload.trip_id,
        incident_type=payload.incident_type,
        description=payload.description,
        amount_requested=payload.amount_requested,
        evidence=payload.evidence,
        status="submitted",
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    return claim


def list_user_claims(
    db: Session,
    user_id: int,
):
    return (
        db.query(TscClaim)
        .filter(
            TscClaim.user_id == user_id
        )
        .order_by(
            TscClaim.id.desc()
        )
        .all()
    )


def review_claim(
    db: Session,
    claim_id: int,
    admin_id: int,
    payload,
):
    claim = (
        db.query(TscClaim)
        .filter(
            TscClaim.id == claim_id
        )
        .first()
    )

    if not claim:
        raise ValueError(
            "Claim not found"
        )

    claim.status = payload.status
    claim.amount_approved = (
        payload.amount_approved
    )
    claim.reviewed_by = admin_id
    claim.review_note = payload.review_note

    if (
        payload.payout
        and payload.status
        in ("approved", "partially_approved")
    ):
        amount = (
            payload.amount_approved
            or 0
        )

        if amount <= 0:
            raise ValueError(
                "Approved payout amount is required"
            )

        if claim.payout_reference:
            raise ValueError(
                "Claim has already been paid"
            )

        wallet = get_wallet_by_user(
            db,
            claim.user_id,
        )

        payout_reference = (
            f"TSC-CLM-{claim.id}-"
            f"{uuid4().hex[:16].upper()}"
        )

        wallet.balance = (
            wallet.balance or 0
        ) + amount

        create_transaction(
            db=db,
            user_id=claim.user_id,
            wallet_id=wallet.id,
            amount=amount,
            transaction_type="claim_payout",
            status="completed",
            reference=payout_reference,
        )

        claim.payout_reference = payout_reference
        claim.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(claim)

    return claim


def create_responder(
    db: Session,
    payload,
):
    responder = TscResponder(
        **payload.model_dump()
    )

    db.add(responder)
    db.commit()
    db.refresh(responder)

    return responder


def list_responders(
    db: Session,
):
    return (
        db.query(TscResponder)
        .order_by(
            TscResponder.id.desc()
        )
        .all()
    )


def create_dispatch(
    db: Session,
    payload,
):
    responder = (
        db.query(TscResponder)
        .filter(
            TscResponder.id
            == payload.responder_id,
            TscResponder.status == "active",
        )
        .first()
    )

    if not responder:
        raise ValueError(
            "Active responder not found"
        )

    dispatch = TscDispatch(
        responder_id=payload.responder_id,
        emergency_id=payload.emergency_id,
        trip_id=payload.trip_id,
        notes=payload.notes,
        status="dispatched",
    )

    responder.availability = "busy"

    db.add(dispatch)
    db.commit()
    db.refresh(dispatch)

    return dispatch


def create_partner(
    db: Session,
    payload,
):
    partner = TscPartner(
        **payload.model_dump()
    )

    db.add(partner)
    db.commit()
    db.refresh(partner)

    return partner


def list_partners(
    db: Session,
):
    return (
        db.query(TscPartner)
        .order_by(
            TscPartner.id.desc()
        )
        .all()
    )


def create_fx_rate(
    db: Session,
    payload,
):
    base = payload.base_currency.upper()
    quote = payload.quote_currency.upper()

    if base == quote:
        raise ValueError(
            "Base and quote currencies must differ"
        )

    existing = (
        db.query(TscFxRate)
        .filter(
            TscFxRate.base_currency == base,
            TscFxRate.quote_currency == quote,
        )
        .first()
    )

    if existing:
        existing.rate = payload.rate
        existing.effective_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    rate = TscFxRate(
        base_currency=base,
        quote_currency=quote,
        rate=payload.rate,
    )

    db.add(rate)
    db.commit()
    db.refresh(rate)

    return rate


def convert_currency(
    db: Session,
    amount: float,
    base_currency: str,
    quote_currency: str,
):
    base = base_currency.upper()
    quote = quote_currency.upper()

    if base == quote:
        return {
            "amount": amount,
            "base_currency": base,
            "quote_currency": quote,
            "rate": 1.0,
            "converted_amount": amount,
        }

    rate = (
        db.query(TscFxRate)
        .filter(
            TscFxRate.base_currency == base,
            TscFxRate.quote_currency == quote,
        )
        .first()
    )

    if not rate:
        raise ValueError(
            "FX rate not configured"
        )

    return {
        "amount": amount,
        "base_currency": base,
        "quote_currency": quote,
        "rate": rate.rate,
        "converted_amount": amount * rate.rate,
    }


def trip_ai_snapshot(
    db: Session,
    trip_id: int,
):
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise ValueError(
            "Trip not found"
        )

    signals = []

    if (
        trip.risk_level
        in ("HIGH", "CRITICAL")
    ):
        signals.append(
            "Current safety engine risk is elevated"
        )

    if (
        trip.average_speed
        and trip.average_speed > 120
    ):
        signals.append(
            "High average speed detected"
        )

    if (
        trip.distance_km
        and trip.distance_km > 300
    ):
        signals.append(
            "Long-distance trip"
        )

    if not signals:
        signals.append(
            "No elevated deterministic signals detected"
        )

    return {
        "trip_id": trip.id,
        "safety_score": trip.safety_score,
        "risk_level": trip.risk_level,
        "distance_km": trip.distance_km or 0,
        "average_speed": trip.average_speed or 0,
        "signals": signals,
        "engine": "deterministic-baseline",
    }
