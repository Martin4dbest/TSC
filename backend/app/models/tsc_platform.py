from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class TscSafetyPolicy(Base):
    __tablename__ = "tsc_safety_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    billing_mode = Column(String, nullable=False, default="per_trip")

    trip_price = Column(Float, nullable=False, default=0.0)
    per_km_rate = Column(Float, nullable=False, default=0.0)
    min_charge = Column(Float, nullable=False, default=0.0)
    max_charge = Column(Float, nullable=False, default=0.0)

    currency = Column(String, nullable=False, default="NGN")
    coverage_limit = Column(Float, nullable=False, default=0.0)
    duration_hours = Column(Integer, nullable=False, default=24)

    coverage_details = Column(Text, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscTripWorkflow(Base):
    __tablename__ = "tsc_trip_workflows"

    id = Column(Integer, primary_key=True, index=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    status = Column(
        String,
        nullable=False,
        default="requested",
        index=True,
    )

    policy_id = Column(
        Integer,
        ForeignKey("tsc_safety_policies.id"),
        nullable=True,
    )

    quoted_trip_price = Column(Float, nullable=True)
    quoted_per_km_rate = Column(Float, nullable=True)
    quoted_min_charge = Column(Float, nullable=True)
    quoted_max_charge = Column(Float, nullable=True)
    quoted_currency = Column(String, nullable=True)
    quoted_coverage_limit = Column(Float, nullable=True)

    requested_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    reviewed_at = Column(DateTime, nullable=True)

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    admin_notes = Column(Text, nullable=True)

    quote_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    trip = relationship("Trip")
    user = relationship(
        "User",
        foreign_keys=[user_id],
    )
    policy = relationship("TscSafetyPolicy")
    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
    )


class TscTripBilling(Base):
    __tablename__ = "tsc_trip_billings"

    id = Column(Integer, primary_key=True, index=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    billing_mode = Column(
        String,
        nullable=False,
        default="per_trip",
    )

    currency = Column(
        String,
        nullable=False,
        default="NGN",
    )

    unit_price = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    minimum_charge = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    maximum_charge = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    billed_km = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    amount_charged = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    status = Column(
        String,
        nullable=False,
        default="active",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscPayment(Base):
    __tablename__ = "tsc_payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    wallet_id = Column(
        Integer,
        ForeignKey("wallets.id"),
        nullable=True,
    )

    reference = Column(
        String,
        nullable=False,
        unique=True,
        index=True,
    )

    provider = Column(
        String,
        nullable=False,
        default="paystack",
    )

    provider_reference = Column(
        String,
        nullable=True,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    currency = Column(
        String,
        nullable=False,
        default="NGN",
    )

    status = Column(
        String,
        nullable=False,
        default="pending",
        index=True,
    )

    authorization_url = Column(
        Text,
        nullable=True,
    )

    access_code = Column(
        String,
        nullable=True,
    )

    raw_response = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscClaim(Base):
    __tablename__ = "tsc_claims"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False,
        index=True,
    )

    incident_type = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    amount_requested = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    amount_approved = Column(
        Float,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="submitted",
        index=True,
    )

    evidence = Column(
        Text,
        nullable=True,
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    review_note = Column(
        Text,
        nullable=True,
    )

    payout_reference = Column(
        String,
        nullable=True,
        unique=True,
    )

    paid_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscResponder(Base):
    __tablename__ = "tsc_responders"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    organization = Column(
        String,
        nullable=True,
    )

    responder_type = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=True,
    )

    email = Column(
        String,
        nullable=True,
    )

    coverage_area = Column(
        String,
        nullable=True,
    )

    latitude = Column(
        Float,
        nullable=True,
    )

    longitude = Column(
        Float,
        nullable=True,
    )

    availability = Column(
        String,
        nullable=False,
        default="available",
        index=True,
    )

    status = Column(
        String,
        nullable=False,
        default="active",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscDispatch(Base):
    __tablename__ = "tsc_dispatches"

    id = Column(Integer, primary_key=True, index=True)

    emergency_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=True,
        index=True,
    )

    responder_id = Column(
        Integer,
        ForeignKey("tsc_responders.id"),
        nullable=False,
        index=True,
    )

    status = Column(
        String,
        nullable=False,
        default="dispatched",
        index=True,
    )

    dispatched_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    arrived_at = Column(
        DateTime,
        nullable=True,
    )

    resolved_at = Column(
        DateTime,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )


class TscPartner(Base):
    __tablename__ = "tsc_partners"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    partner_type = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=True,
    )

    email = Column(
        String,
        nullable=True,
    )

    coverage_area = Column(
        String,
        nullable=True,
    )

    integration_url = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="active",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class TscFxRate(Base):
    __tablename__ = "tsc_fx_rates"

    id = Column(Integer, primary_key=True, index=True)

    base_currency = Column(
        String,
        nullable=False,
    )

    quote_currency = Column(
        String,
        nullable=False,
    )

    rate = Column(
        Float,
        nullable=False,
    )

    effective_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "base_currency",
            "quote_currency",
            name="uq_tsc_fx_pair",
        ),
    )
