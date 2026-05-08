from sqlalchemy import Column, Integer, ForeignKey, Float, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    wallet_id = Column(Integer, ForeignKey("wallets.id"))

    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)
    status = Column(String, default="pending")

    reference = Column(String, unique=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    wallet = relationship("Wallet")