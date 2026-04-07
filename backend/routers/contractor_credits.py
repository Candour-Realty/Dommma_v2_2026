"""Contractor Credits monetization router"""
import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contractor-credits", tags=["contractor-credits"])

FREE_CREDITS = 5  # Free leads for new contractors
CREDIT_COST = 4.99  # Cost per credit


class CreditPurchase(BaseModel):
    contractor_id: str
    credits: int


@router.get("/balance/{contractor_id}")
async def get_credit_balance(contractor_id: str):
    """Get contractor's credit balance and usage stats"""
    balance = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    if not balance:
        balance = {
            "contractor_id": contractor_id,
            "credits": FREE_CREDITS,
            "total_purchased": 0,
            "total_used": 0,
            "leads_accepted": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.contractor_credits.insert_one(balance)
        balance.pop("_id", None)

    return balance


@router.post("/purchase")
async def purchase_credits(purchase: CreditPurchase):
    """Purchase additional lead credits"""
    if purchase.credits < 1:
        raise HTTPException(status_code=400, detail="Must purchase at least 1 credit")

    total_cost = purchase.credits * CREDIT_COST

    balance = await db.contractor_credits.find_one({"contractor_id": purchase.contractor_id})
    if not balance:
        await db.contractor_credits.insert_one({
            "contractor_id": purchase.contractor_id,
            "credits": FREE_CREDITS + purchase.credits,
            "total_purchased": purchase.credits,
            "total_used": 0,
            "leads_accepted": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        await db.contractor_credits.update_one(
            {"contractor_id": purchase.contractor_id},
            {"$inc": {"credits": purchase.credits, "total_purchased": purchase.credits}}
        )

    tx_id = str(uuid.uuid4())
    await db.credit_transactions.insert_one({
        "id": tx_id,
        "contractor_id": purchase.contractor_id,
        "type": "purchase",
        "credits": purchase.credits,
        "amount": total_cost,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    updated = await db.contractor_credits.find_one({"contractor_id": purchase.contractor_id}, {"_id": 0})
    return {
        "success": True,
        "transaction_id": tx_id,
        "credits_added": purchase.credits,
        "total_cost": total_cost,
        "balance": updated
    }


@router.post("/use/{contractor_id}")
async def use_credit(contractor_id: str, lead_id: Optional[str] = None):
    """Use a credit to accept a lead"""
    balance = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    if not balance:
        raise HTTPException(status_code=404, detail="No credit account found")

    if balance.get("credits", 0) <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining. Please purchase more credits.")

    await db.contractor_credits.update_one(
        {"contractor_id": contractor_id},
        {"$inc": {"credits": -1, "total_used": 1, "leads_accepted": 1}}
    )

    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "contractor_id": contractor_id,
        "type": "use",
        "credits": -1,
        "lead_id": lead_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    updated = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    return {"success": True, "remaining_credits": updated.get("credits", 0)}


@router.get("/history/{contractor_id}")
async def get_credit_history(contractor_id: str, limit: int = 50):
    """Get credit transaction history"""
    transactions = await db.credit_transactions.find(
        {"contractor_id": contractor_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return transactions


@router.get("/pricing")
async def get_credit_pricing():
    """Get credit pricing tiers"""
    return {
        "per_credit": CREDIT_COST,
        "free_credits": FREE_CREDITS,
        "bundles": [
            {"credits": 10, "price": 39.99, "savings": "20%"},
            {"credits": 25, "price": 87.49, "savings": "30%"},
            {"credits": 50, "price": 149.99, "savings": "40%"},
        ],
        "guarantee": "DOMMMA guarantees lead quality. If a lead is unresponsive or spam, we refund the credit."
    }
