from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class TscBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TripRequestCreate(BaseModel):
    start_location: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None


class AdminTripReview(BaseModel):
    status: Literal["approved", "rejected"]
    policy_id: Optional[int] = None

    trip_price: Optional[float] = Field(
        default=None,
        ge=0,
    )

    per_km_rate: Optional[float] = Field(
        default=None,
        ge=0,
    )

    min_charge: Optional[float] = Field(
        default=None,
        ge=0,
    )

    max_charge: Optional[float] = Field(
        default=None,
        ge=0,
    )

    coverage_limit: Optional[float] = Field(
        default=None,
        ge=0,
    )

    admin_notes: Optional[str] = None


class SafetyPolicyCreate(BaseModel):
    name: str = Field(min_length=2)

    billing_mode: Literal[
        "per_trip",
        "per_km",
    ]

    trip_price: float = Field(
        default=0,
        ge=0,
    )

    per_km_rate: float = Field(
        default=0,
        ge=0,
    )

    min_charge: float = Field(
        default=0,
        ge=0,
    )

    max_charge: float = Field(
        default=0,
        ge=0,
    )

    currency: str = "NGN"

    coverage_limit: float = Field(
        default=0,
        ge=0,
    )

    duration_hours: int = Field(
        default=24,
        ge=1,
    )

    coverage_details: Optional[str] = None
    enabled: bool = True


class SafetyPolicyUpdate(BaseModel):
    name: Optional[str] = None

    billing_mode: Optional[
        Literal["per_trip", "per_km"]
    ] = None

    trip_price: Optional[float] = Field(
        default=None,
        ge=0,
    )

    per_km_rate: Optional[float] = Field(
        default=None,
        ge=0,
    )

    min_charge: Optional[float] = Field(
        default=None,
        ge=0,
    )

    max_charge: Optional[float] = Field(
        default=None,
        ge=0,
    )

    currency: Optional[str] = None

    coverage_limit: Optional[float] = Field(
        default=None,
        ge=0,
    )

    duration_hours: Optional[int] = Field(
        default=None,
        ge=1,
    )

    coverage_details: Optional[str] = None
    enabled: Optional[bool] = None


class ClaimCreate(BaseModel):
    trip_id: int
    incident_type: str = Field(min_length=2)
    description: str = Field(min_length=5)
    amount_requested: float = Field(gt=0)
    evidence: Optional[str] = None


class ClaimReview(BaseModel):
    status: Literal[
        "approved",
        "partially_approved",
        "rejected",
        "investigation",
    ]

    amount_approved: Optional[float] = Field(
        default=None,
        ge=0,
    )

    review_note: Optional[str] = None

    payout: bool = False


class ResponderCreate(BaseModel):
    name: str = Field(min_length=2)
    organization: Optional[str] = None
    responder_type: str = Field(min_length=2)
    phone: Optional[str] = None
    email: Optional[str] = None
    coverage_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: str = "available"


class PartnerCreate(BaseModel):
    name: str = Field(min_length=2)
    partner_type: str = Field(min_length=2)
    phone: Optional[str] = None
    email: Optional[str] = None
    coverage_area: Optional[str] = None
    integration_url: Optional[str] = None


class DispatchCreate(BaseModel):
    responder_id: int
    emergency_id: Optional[int] = None
    trip_id: Optional[int] = None
    notes: Optional[str] = None


class FxRateCreate(BaseModel):
    base_currency: str = Field(
        min_length=3,
        max_length=3,
    )

    quote_currency: str = Field(
        min_length=3,
        max_length=3,
    )

    rate: float = Field(gt=0)


class FxConvertRequest(BaseModel):
    amount: float = Field(gt=0)

    base_currency: str = Field(
        min_length=3,
        max_length=3,
    )

    quote_currency: str = Field(
        min_length=3,
        max_length=3,
    )


class WalletPaymentInitialize(BaseModel):
    amount: float = Field(
        ge=100,
        le=10000,
    )

    currency: str = "NGN"
    callback_url: Optional[str] = None


class PaymentRead(TscBase):
    id: int
    reference: str
    provider: str
    amount: float
    currency: str
    status: str
    authorization_url: Optional[str] = None
    access_code: Optional[str] = None


class ClaimRead(TscBase):
    id: int
    user_id: int
    trip_id: int
    incident_type: str
    description: str
    amount_requested: float
    amount_approved: Optional[float]
    status: str
    evidence: Optional[str]
    review_note: Optional[str]
    payout_reference: Optional[str]
    paid_at: Optional[str]
