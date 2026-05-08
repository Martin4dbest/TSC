# app/services/wallet_service.py
from sqlalchemy.orm import Session
from app.models.wallet import Wallet
from app.models.transaction import Transaction


# -------------------------------
# Get Wallet
# -------------------------------
def get_wallet_by_user(db: Session, user_id: int):
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()

    if not wallet:
        # auto-create wallet if not exists
        wallet = Wallet(user_id=user_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    return wallet


# -------------------------------
# Create Transaction
# -------------------------------
def create_transaction(db: Session, user_id: int, amount: float, tx_type: str, description: str = None):
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        type=tx_type,
        description=description
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


# -------------------------------
# Add Funds
# -------------------------------
def add_funds(db: Session, user_id: int, amount: float, description: str = None):
    if amount <= 0:
        raise Exception("Amount must be greater than 0")

    wallet = get_wallet_by_user(db, user_id)

    wallet.balance += amount
    db.commit()

    return create_transaction(db, user_id, amount, "credit", description)


# -------------------------------
# Withdraw Funds
# -------------------------------
def withdraw_funds(db: Session, user_id: int, amount: float, description: str = None):
    if amount <= 0:
        raise Exception("Amount must be greater than 0")

    wallet = get_wallet_by_user(db, user_id)

    if wallet.balance < amount:
        raise Exception("Insufficient funds")

    wallet.balance -= amount
    db.commit()

    return create_transaction(db, user_id, amount, "debit", description)


# -------------------------------
# List Transactions
# -------------------------------
def list_transactions(db: Session, user_id: int):
    return db.query(Transaction).filter(Transaction.user_id == user_id).all()