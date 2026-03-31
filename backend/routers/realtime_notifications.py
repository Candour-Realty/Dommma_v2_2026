"""Real-time WebSocket notifications router"""
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    body: str
    type: str = "general"
    data: Optional[dict] = None


@router.get("/{user_id}")
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return notifications


@router.get("/{user_id}/count")
async def get_unread_count(user_id: str):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read"""
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


@router.put("/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user"""
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "marked_read": result.modified_count}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    await db.notifications.delete_one({"id": notification_id})
    return {"success": True}


@router.delete("/{user_id}/clear")
async def clear_notifications(user_id: str):
    """Clear all notifications for a user"""
    result = await db.notifications.delete_many({"user_id": user_id})
    return {"success": True, "deleted": result.deleted_count}
