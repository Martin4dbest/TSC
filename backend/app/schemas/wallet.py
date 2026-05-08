from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# -------------------------------
# Wallet Schemas
# -------------------------------
class WalletRead(BaseModel):
    id: int
    user_id: int
    balance: float

    class Config:
        from_attributes = True


# -------------------------------
# Transaction Schemas
# -------------------------------
class TransactionCreate(BaseModel):
    amount: float
    description: Optional[str] = None


class TransactionRead(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str  # credit / debit
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True