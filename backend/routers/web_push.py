"""Web Push Notifications router - Subscribe, Unsubscribe, Send Push"""
import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/push", tags=["push-notifications"])


class PushSubscription(BaseModel):
    user_id: str
    subscription: Dict[str, Any]  # Web Push subscription object


class PushNotificationSend(BaseModel):
    user_id: str
    title: str
    body: str
    icon: Optional[str] = "/logo192.png"
    url: Optional[str] = "/"
    data: Optional[Dict[str, Any]] = None


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Return VAPID public key for frontend subscription"""
    key = os.environ.get("VAPID_PUBLIC_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": key}


@router.post("/subscribe")
async def subscribe_push(sub: PushSubscription):
    """Save a user's push subscription"""
    await db.push_subscriptions.update_one(
        {"user_id": sub.user_id},
        {"$set": {
            "user_id": sub.user_id,
            "subscription": sub.subscription,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True, "message": "Push subscription saved"}


@router.delete("/unsubscribe/{user_id}")
async def unsubscribe_push(user_id: str):
    """Remove a user's push subscription"""
    await db.push_subscriptions.delete_one({"user_id": user_id})
    return {"success": True, "message": "Push subscription removed"}


@router.post("/send")
async def send_push_notification(notification: PushNotificationSend):
    """Send a push notification to a specific user"""
    from pywebpush import webpush, WebPushException

    sub_doc = await db.push_subscriptions.find_one({"user_id": notification.user_id}, {"_id": 0})
    if not sub_doc:
        return {"success": False, "message": "No push subscription found for user"}

    vapid_private_key = os.environ.get("VAPID_PRIVATE_KEY")
    vapid_claims_email = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:support@dommma.com")

    if not vapid_private_key:
        raise HTTPException(status_code=503, detail="VAPID private key not configured")

    payload = json.dumps({
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "url": notification.url,
        "data": notification.data or {}
    })

    try:
        webpush(
            subscription_info=sub_doc["subscription"],
            data=payload,
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_claims_email}
        )
        return {"success": True, "message": "Push notification sent"}
    except WebPushException as e:
        logger.error(f"Web push error: {e}")
        if e.response and e.response.status_code in (404, 410):
            await db.push_subscriptions.delete_one({"user_id": notification.user_id})
            return {"success": False, "message": "Subscription expired, removed"}
        raise HTTPException(status_code=500, detail=f"Push notification failed: {str(e)}")


@router.post("/send-bulk")
async def send_bulk_push(title: str, body: str, user_ids: list = None):
    """Send push notification to multiple users or all subscribed users"""
    from pywebpush import webpush, WebPushException

    vapid_private_key = os.environ.get("VAPID_PRIVATE_KEY")
    vapid_claims_email = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:support@dommma.com")

    if not vapid_private_key:
        raise HTTPException(status_code=503, detail="VAPID private key not configured")

    query = {}
    if user_ids:
        query["user_id"] = {"$in": user_ids}

    subscriptions = await db.push_subscriptions.find(query, {"_id": 0}).to_list(1000)

    payload = json.dumps({"title": title, "body": body, "icon": "/logo192.png", "url": "/"})

    sent = 0
    failed = 0
    for sub_doc in subscriptions:
        try:
            webpush(
                subscription_info=sub_doc["subscription"],
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims={"sub": vapid_claims_email}
            )
            sent += 1
        except WebPushException as e:
            failed += 1
            if e.response and e.response.status_code in (404, 410):
                await db.push_subscriptions.delete_one({"user_id": sub_doc["user_id"]})

    return {"success": True, "sent": sent, "failed": failed, "total": len(subscriptions)}
