from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WalletRead(BaseModel):
    id: int
    user_id: int
    balance: float

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    amount: float
    description: Optional[str] = None


class TransactionRead(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: str
    status: Optional[str] = None
    reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
