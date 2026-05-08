# app/api/v1/wallet.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction

from app.schemas.wallet import WalletRead, TransactionCreate, TransactionRead

# ✅ FIXED IMPORT (THIS WAS YOUR ERROR)
from app.core.dependencies import get_current_user, get_current_admin

from app.services.wallet_service import (
    get_wallet_by_user,
    add_funds,
    withdraw_funds,
    list_transactions,
)

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)

# ------------------------
# Get current user's wallet
# ------------------------
@router.get("/me", response_model=WalletRead)
def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_wallet_by_user(db, current_user.id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    return wallet


# ------------------------
# Admin: Get any user's wallet
# ------------------------
@router.get("/{user_id}", response_model=WalletRead)
def get_user_wallet(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    wallet = get_wallet_by_user(db, user_id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    return wallet


# ------------------------
# Add funds to wallet
# ------------------------
@router.post("/add", response_model=TransactionRead)
def fund_wallet(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return add_funds(
        db=db,
        user_id=current_user.id,
        amount=transaction.amount,
        description=transaction.description
    )


# ------------------------
# Withdraw funds
# ------------------------
@router.post("/withdraw", response_model=TransactionRead)
def withdraw_from_wallet(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return withdraw_funds(
        db=db,
        user_id=current_user.id,
        amount=transaction.amount,
        description=transaction.description
    )


# ------------------------
# List wallet transactions
# ------------------------
@router.get("/transactions", response_model=List[TransactionRead])
def wallet_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_transactions(
        db=db,
        user_id=current_user.id
    )