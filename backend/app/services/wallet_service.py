from sqlalchemy.orm import Session

from app.models.wallet import Wallet
from app.models.transaction import Transaction


# =========================
# GET / CREATE WALLET
# =========================
def get_wallet_by_user(db: Session, user_id: int):
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == user_id)
        .first()
    )

    if not wallet:
        wallet = Wallet(
            user_id=user_id,
            balance=0.0,
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    return wallet


# =========================
# CREATE TRANSACTION
# =========================
def create_transaction(
    db: Session,
    user_id: int,
    wallet_id: int,
    amount: float,
    transaction_type: str,
    status: str = "completed",
    reference: str | None = None,
):
    transaction = Transaction(
        user_id=user_id,
        wallet_id=wallet_id,
        amount=amount,
        transaction_type=transaction_type,
        status=status,
        reference=reference,
    )

    db.add(transaction)
    db.flush()

    return transaction


# =========================
# ADD FUNDS
# =========================
def add_funds(
    db: Session,
    user_id: int,
    amount: float,
    description: str = None,
):
    if amount <= 0:
        raise ValueError("Amount must be greater than 0")

    wallet = get_wallet_by_user(db, user_id)

    wallet.balance = (wallet.balance or 0.0) + amount

    transaction = create_transaction(
        db=db,
        user_id=user_id,
        wallet_id=wallet.id,
        amount=amount,
        transaction_type="credit",
        status="completed",
    )

    db.commit()
    db.refresh(transaction)

    return transaction


# =========================
# WITHDRAW FUNDS
# =========================
def withdraw_funds(
    db: Session,
    user_id: int,
    amount: float,
    description: str = None,
):
    if amount <= 0:
        raise ValueError("Amount must be greater than 0")

    wallet = get_wallet_by_user(db, user_id)

    if (wallet.balance or 0.0) < amount:
        raise ValueError("Insufficient funds")

    wallet.balance -= amount

    transaction = create_transaction(
        db=db,
        user_id=user_id,
        wallet_id=wallet.id,
        amount=amount,
        transaction_type="debit",
        status="completed",
    )

    db.commit()
    db.refresh(transaction)

    return transaction


# =========================
# LIST TRANSACTIONS
# =========================
def list_transactions(db: Session, user_id: int):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.id.desc())
        .all()
    )
