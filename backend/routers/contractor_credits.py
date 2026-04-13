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

FREE_MONTHLY_LEADS = 3  # Free leads per month (resets monthly)
CREDIT_COST = 5.00  # Cost per additional lead credit


class CreditPurchase(BaseModel):
    contractor_id: str
    credits: int


@router.get("/balance/{contractor_id}")
async def get_credit_balance(contractor_id: str):
    """Get contractor's credit balance and usage stats.
    Freemium model: 3 free leads/month (resets on 1st), then $5/lead."""
    balance = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")

    if not balance:
        balance = {
            "contractor_id": contractor_id,
            "credits": 0,
            "free_leads_used_this_month": 0,
            "current_month": current_month,
            "total_purchased": 0,
            "total_used": 0,
            "leads_accepted": 0,
            "created_at": now.isoformat()
        }
        await db.contractor_credits.insert_one(balance)
        balance.pop("_id", None)
    else:
        # Reset free leads counter on new month
        if balance.get("current_month") != current_month:
            await db.contractor_credits.update_one(
                {"contractor_id": contractor_id},
                {"$set": {"free_leads_used_this_month": 0, "current_month": current_month}}
            )
            balance["free_leads_used_this_month"] = 0
            balance["current_month"] = current_month

    # Calculate available
    free_remaining = max(0, FREE_MONTHLY_LEADS - balance.get("free_leads_used_this_month", 0))
    paid_credits = balance.get("credits", 0)

    balance["free_leads_remaining"] = free_remaining
    balance["paid_credits"] = paid_credits
    balance["total_available"] = free_remaining + paid_credits
    balance["plan"] = "free" if paid_credits == 0 else "premium"

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
            "credits": purchase.credits,
            "free_leads_used_this_month": 0,
            "current_month": datetime.now(timezone.utc).strftime("%Y-%m"),
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
    """Use a lead credit. Free leads used first, then paid credits.
    Freemium: 3 free/month, then $5/lead."""
    balance = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")

    if not balance:
        # Auto-create account
        balance = {
            "contractor_id": contractor_id,
            "credits": 0,
            "free_leads_used_this_month": 0,
            "current_month": current_month,
            "total_purchased": 0,
            "total_used": 0,
            "leads_accepted": 0,
            "created_at": now.isoformat()
        }
        await db.contractor_credits.insert_one(balance)

    # Reset monthly free leads if new month
    if balance.get("current_month") != current_month:
        await db.contractor_credits.update_one(
            {"contractor_id": contractor_id},
            {"$set": {"free_leads_used_this_month": 0, "current_month": current_month}}
        )
        balance["free_leads_used_this_month"] = 0

    free_used = balance.get("free_leads_used_this_month", 0)
    paid_credits = balance.get("credits", 0)

    if free_used < FREE_MONTHLY_LEADS:
        # Use a free lead
        credit_type = "free"
        await db.contractor_credits.update_one(
            {"contractor_id": contractor_id},
            {"$inc": {"free_leads_used_this_month": 1, "total_used": 1, "leads_accepted": 1}}
        )
    elif paid_credits > 0:
        # Use a paid credit
        credit_type = "paid"
        await db.contractor_credits.update_one(
            {"contractor_id": contractor_id},
            {"$inc": {"credits": -1, "total_used": 1, "leads_accepted": 1}}
        )
    else:
        raise HTTPException(
            status_code=402,
            detail=f"No leads remaining this month. You've used your {FREE_MONTHLY_LEADS} free leads. Purchase credits at $5/lead to continue."
        )

    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "contractor_id": contractor_id,
        "type": credit_type,
        "credits": -1,
        "lead_id": lead_id,
        "created_at": now.isoformat()
    })

    updated = await db.contractor_credits.find_one({"contractor_id": contractor_id}, {"_id": 0})
    free_remaining = max(0, FREE_MONTHLY_LEADS - updated.get("free_leads_used_this_month", 0))

    return {
        "success": True,
        "credit_type_used": credit_type,
        "free_leads_remaining": free_remaining,
        "paid_credits_remaining": updated.get("credits", 0),
        "total_available": free_remaining + updated.get("credits", 0)
    }


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
        "model": "freemium",
        "free_monthly_leads": FREE_MONTHLY_LEADS,
        "per_credit": CREDIT_COST,
        "bundles": [
            {"credits": 10, "price": 39.99, "per_lead": 4.00, "savings": "20%"},
            {"credits": 25, "price": 87.50, "per_lead": 3.50, "savings": "30%"},
            {"credits": 50, "price": 149.99, "per_lead": 3.00, "savings": "40%"},
            {"credits": 100, "price": 249.99, "per_lead": 2.50, "savings": "50%"},
        ],
        "guarantee": "DOMMMA guarantees lead quality. If a lead is unresponsive or spam, we refund the credit.",
        "description": f"Every contractor gets {FREE_MONTHLY_LEADS} free leads per month. After that, credits cost ${CREDIT_COST}/lead or less with bundles."
    }
