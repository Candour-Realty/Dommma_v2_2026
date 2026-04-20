"""Contractor availability schedules + booking acceptance flow.

Backs the public contractor profile calendar + BCAA-style booking widget.
Week-based recurring availability, bookings require contractor confirmation.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from db import db
from services.email import (
    email_footer,
    email_wrapper_end,
    email_wrapper_start,
    send_email,
    send_email_with_calendar,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["contractor-availability"])


# ─────────────────────────── MODELS ───────────────────────────

class DailySchedule(BaseModel):
    """One day of the week in the contractor's recurring schedule.

    `enabled` False = closed that day. Times are 24h 'HH:MM' strings.
    """
    day_of_week: int  # 0 = Sunday ... 6 = Saturday
    enabled: bool = False
    start_time: str = "09:00"
    end_time: str = "17:00"


class ContractorAvailability(BaseModel):
    """Weekly recurring availability for a contractor.

    A single row per contractor. `schedule` always has 7 entries (Sun..Sat).
    """
    model_config = ConfigDict(extra="ignore")
    contractor_id: str  # = user_id of the contractor
    schedule: List[DailySchedule] = Field(default_factory=list)
    slot_minutes: int = 60  # booking granularity (30/60/120)
    buffer_minutes: int = 0  # buffer between back-to-back bookings
    timezone: str = "America/Vancouver"
    advance_notice_hours: int = 24  # min lead time for new bookings
    max_advance_days: int = 60  # how far out a customer can book
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AvailabilityUpdate(BaseModel):
    schedule: List[DailySchedule]
    slot_minutes: Optional[int] = 60
    buffer_minutes: Optional[int] = 0
    timezone: Optional[str] = "America/Vancouver"
    advance_notice_hours: Optional[int] = 24
    max_advance_days: Optional[int] = 60


class BookingRequest(BaseModel):
    """Customer-facing booking request from the public calendar widget."""
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str = ""
    booking_date: str   # YYYY-MM-DD
    booking_time: str   # HH:MM (24h)
    duration_minutes: int = 60
    address: str = ""
    notes: Optional[str] = None
    # Customer contact (for anon bookings) — if logged in, server fills from user
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


def _default_schedule() -> List[Dict[str, Any]]:
    """A sensible starting schedule: weekdays 9–5, weekends off."""
    return [
        {"day_of_week": 0, "enabled": False, "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 1, "enabled": True,  "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 2, "enabled": True,  "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 3, "enabled": True,  "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 4, "enabled": True,  "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 5, "enabled": True,  "start_time": "09:00", "end_time": "17:00"},
        {"day_of_week": 6, "enabled": False, "start_time": "09:00", "end_time": "17:00"},
    ]


# ─────────────────────── AVAILABILITY ENDPOINTS ───────────────────────

@router.get("/contractors/{contractor_id}/availability")
async def get_availability(contractor_id: str):
    """Public endpoint — returns the contractor's weekly schedule + config."""
    doc = await db.contractor_availability.find_one({"contractor_id": contractor_id}, {"_id": 0})
    if not doc:
        # Return a sensible default so the UI always has something to render
        return {
            "contractor_id": contractor_id,
            "schedule": _default_schedule(),
            "slot_minutes": 60,
            "buffer_minutes": 0,
            "timezone": "America/Vancouver",
            "advance_notice_hours": 24,
            "max_advance_days": 60,
            "is_default": True,
        }
    doc["is_default"] = False
    return doc


@router.put("/contractors/{contractor_id}/availability")
async def update_availability(contractor_id: str, body: AvailabilityUpdate, user_id: str):
    """Contractor-only. Save weekly schedule."""
    if user_id != contractor_id:
        raise HTTPException(status_code=403, detail="Only the contractor can edit their own schedule")

    # Normalize: always 7 entries, one per weekday
    schedule = sorted(body.schedule, key=lambda d: d.day_of_week)
    seen_days = {d.day_of_week for d in schedule}
    for i in range(7):
        if i not in seen_days:
            schedule.append(DailySchedule(day_of_week=i, enabled=False))
    schedule = sorted(schedule, key=lambda d: d.day_of_week)

    update = {
        "contractor_id": contractor_id,
        "schedule": [d.model_dump() for d in schedule],
        "slot_minutes": body.slot_minutes or 60,
        "buffer_minutes": body.buffer_minutes or 0,
        "timezone": body.timezone or "America/Vancouver",
        "advance_notice_hours": body.advance_notice_hours or 24,
        "max_advance_days": body.max_advance_days or 60,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contractor_availability.update_one(
        {"contractor_id": contractor_id},
        {"$set": update},
        upsert=True,
    )
    return {"ok": True, "availability": update}


@router.get("/contractors/{contractor_id}/booked-slots")
async def get_booked_slots(contractor_id: str, start_date: str, end_date: str):
    """Return date+time of all non-cancelled bookings in the range.

    The public calendar uses this to grey out slots that are already taken.
    """
    try:
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be YYYY-MM-DD")

    bookings = await db.bookings.find(
        {
            "contractor_id": contractor_id,
            "preferred_date": {"$gte": start_date, "$lte": end_date},
            "status": {"$in": ["pending", "confirmed", "in_progress"]},
        },
        {"_id": 0, "preferred_date": 1, "preferred_time": 1, "status": 1, "id": 1},
    ).to_list(500)
    return {"booked_slots": bookings}


# ─────────────────────── PUBLIC PROFILE ───────────────────────

@router.get("/contractors/{contractor_id}/public")
async def get_public_contractor(contractor_id: str):
    """Everything a customer needs to render a public contractor page.

    No auth required — this is shared via URL, shown to anonymous visitors.
    Combines: profile, services, portfolio, recent reviews.
    """
    profile = await db.contractor_profiles.find_one({"user_id": contractor_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Contractor not found")

    services = await db.contractor_services.find(
        {"contractor_id": profile.get("id"), "status": "active"},
        {"_id": 0},
    ).to_list(50) if profile.get("id") else []

    # Portfolio projects live under user_id in some schemas and contractor_id in others
    portfolio = await db.portfolio_projects.find(
        {"$or": [{"contractor_id": contractor_id}, {"user_id": contractor_id}]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(20)

    # Recent reviews — joined from bookings
    review_bookings = await db.bookings.find(
        {"contractor_id": contractor_id, "rating": {"$exists": True, "$ne": None}},
        {"_id": 0, "rating": 1, "review": 1, "customer_id": 1, "created_at": 1, "title": 1},
    ).sort("created_at", -1).limit(10).to_list(10)
    for r in review_bookings:
        cust = await db.users.find_one({"id": r.get("customer_id")}, {"_id": 0, "name": 1, "full_name": 1})
        r["customer_name"] = (cust or {}).get("full_name") or (cust or {}).get("name") or "Customer"

    # Strip server-only fields from profile if any
    profile.pop("email", None) if not profile.get("public_email") else None
    return {
        "profile": profile,
        "services": services,
        "portfolio": portfolio,
        "reviews": review_bookings,
    }


# ─────────────────────── BOOKING REQUEST / RESPOND ───────────────────────

def _day_of_week_for(date_str: str) -> int:
    """Mon=0 in Python — we need Sun=0. Convert."""
    py_dow = datetime.strptime(date_str, "%Y-%m-%d").weekday()  # Mon=0..Sun=6
    return (py_dow + 1) % 7  # Sun=0..Sat=6


async def _slot_is_available(contractor_id: str, date_str: str, time_str: str, duration_minutes: int) -> Optional[str]:
    """Return None if slot is available, otherwise a reason string."""
    avail_doc = await db.contractor_availability.find_one({"contractor_id": contractor_id}, {"_id": 0})
    schedule = (avail_doc or {}).get("schedule") or _default_schedule()
    advance_hours = (avail_doc or {}).get("advance_notice_hours", 24)
    max_days = (avail_doc or {}).get("max_advance_days", 60)

    # Check date is not in the past / too far out
    try:
        req_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        return "Invalid date/time format"
    now = datetime.utcnow()
    if req_dt < now + timedelta(hours=advance_hours):
        return f"Bookings must be made at least {advance_hours}h in advance"
    if req_dt > now + timedelta(days=max_days):
        return f"Can only book up to {max_days} days ahead"

    # Check the day of week is enabled and the time falls within working hours
    dow = _day_of_week_for(date_str)
    day_rule = next((d for d in schedule if d.get("day_of_week") == dow), None)
    if not day_rule or not day_rule.get("enabled"):
        return "Contractor is not available on that day"
    try:
        start_h, start_m = [int(x) for x in day_rule["start_time"].split(":")]
        end_h, end_m = [int(x) for x in day_rule["end_time"].split(":")]
        req_h, req_m = [int(x) for x in time_str.split(":")]
    except (ValueError, KeyError):
        return "Schedule is not configured correctly"
    req_minutes = req_h * 60 + req_m
    end_minutes_of_slot = req_minutes + duration_minutes
    start_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    if req_minutes < start_minutes or end_minutes_of_slot > end_minutes:
        return "Requested time is outside contractor's working hours"

    # Check for conflicting bookings at the same slot
    conflict = await db.bookings.find_one({
        "contractor_id": contractor_id,
        "preferred_date": date_str,
        "preferred_time": time_str,
        "status": {"$in": ["pending", "confirmed", "in_progress"]},
    })
    if conflict:
        return "That slot is already taken"
    return None


@router.post("/contractors/{contractor_id}/book")
async def request_booking(
    contractor_id: str,
    body: BookingRequest,
    customer_id: Optional[str] = None,  # empty for anonymous bookings
):
    """Customer requests a booking at a specific date+time.

    Creates a ServiceBooking in 'pending' status and notifies the contractor.
    The contractor must accept (/confirm) before it's finalized.
    """
    # Validate contractor exists
    profile = await db.contractor_profiles.find_one({"user_id": contractor_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Contractor not found")

    # Validate availability
    reason = await _slot_is_available(
        contractor_id, body.booking_date, body.booking_time, body.duration_minutes
    )
    if reason:
        raise HTTPException(status_code=400, detail=reason)

    # Resolve customer identity
    customer_name = body.customer_name or "Customer"
    customer_email = body.customer_email
    if customer_id:
        user = await db.users.find_one({"id": customer_id}, {"_id": 0})
        if user:
            customer_name = (user.get("full_name") or user.get("name") or customer_name).strip()
            customer_email = customer_email or user.get("email")

    if not customer_email:
        raise HTTPException(status_code=400, detail="Customer email is required")

    # Build booking
    booking_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    booking_doc = {
        "id": booking_id,
        "customer_id": customer_id or f"guest:{customer_email}",
        "contractor_id": contractor_id,
        "service_id": body.service_id,
        "title": body.title,
        "description": body.description,
        "preferred_date": body.booking_date,
        "preferred_time": body.booking_time,
        "duration_minutes": body.duration_minutes,
        "address": body.address,
        "status": "pending",
        "amount": None,
        "payment_status": "unpaid",
        "notes": body.notes,
        "rating": None,
        "review": None,
        "customer_name_snapshot": customer_name,
        "customer_email_snapshot": customer_email,
        "customer_phone_snapshot": body.customer_phone,
        "created_at": now,
        "updated_at": now,
    }
    # Attach service price if available
    if body.service_id:
        service = await db.contractor_services.find_one({"id": body.service_id}, {"_id": 0})
        if service and service.get("price"):
            booking_doc["amount"] = service["price"]

    await db.bookings.insert_one(booking_doc)

    # In-app notification for the contractor
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": contractor_id,
        "title": "New Booking Request",
        "body": f"{customer_name} requested {body.title} on {body.booking_date} at {body.booking_time}",
        "type": "booking_request",
        "data": {"booking_id": booking_id},
        "read": False,
        "created_at": now,
    })

    # Emails (async, non-blocking) — contractor gets the action email, customer gets an ack
    contractor_user = await db.users.find_one({"id": contractor_id}, {"_id": 0})
    contractor_email = (profile or {}).get("email") or (contractor_user or {}).get("email")
    contractor_name = (profile or {}).get("business_name") or (contractor_user or {}).get("full_name") or "there"

    if contractor_email:
        asyncio.create_task(send_email(
            contractor_email,
            f"New booking request — {body.title}",
            _email_booking_request_to_contractor(
                contractor_name=contractor_name,
                customer_name=customer_name,
                title=body.title,
                booking_date=body.booking_date,
                booking_time=body.booking_time,
                notes=body.notes or body.description,
                address=body.address,
                booking_id=booking_id,
            ),
        ))

    asyncio.create_task(send_email(
        customer_email,
        f"Booking request sent — {body.title}",
        _email_booking_request_to_customer(
            customer_name=customer_name,
            contractor_name=contractor_name,
            title=body.title,
            booking_date=body.booking_date,
            booking_time=body.booking_time,
        ),
    ))

    booking_doc.pop("_id", None)
    return booking_doc


@router.post("/bookings/{booking_id}/respond")
async def respond_to_booking(booking_id: str, action: str, user_id: str, message: Optional[str] = None):
    """Contractor accepts or declines a booking request.

    action: 'accept' | 'decline'
    Customer gets a confirmation email (with .ics on accept) or a decline note.
    """
    if action not in {"accept", "decline"}:
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'decline'")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("contractor_id") != user_id:
        raise HTTPException(status_code=403, detail="Only the contractor can respond to this booking")
    if booking.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Booking already {booking.get('status')}")

    new_status = "confirmed" if action == "accept" else "cancelled"
    now = datetime.now(timezone.utc).isoformat()
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": new_status, "updated_at": now, "contractor_response": message}},
    )

    # Resolve customer contact
    customer_email = booking.get("customer_email_snapshot")
    customer_name = booking.get("customer_name_snapshot") or "Customer"
    if not customer_email and booking.get("customer_id") and not str(booking["customer_id"]).startswith("guest:"):
        cust = await db.users.find_one({"id": booking["customer_id"]}, {"_id": 0})
        if cust:
            customer_email = cust.get("email")
            customer_name = cust.get("full_name") or cust.get("name") or customer_name

    # Resolve contractor name
    profile = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
    contractor_name = (profile or {}).get("business_name") or "your provider"

    # In-app notification for the customer
    if booking.get("customer_id") and not str(booking["customer_id"]).startswith("guest:"):
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": booking["customer_id"],
            "title": "Booking confirmed" if action == "accept" else "Booking declined",
            "body": f"{contractor_name} has {new_status} your booking '{booking.get('title')}'.",
            "type": "booking",
            "data": {"booking_id": booking_id, "status": new_status},
            "read": False,
            "created_at": now,
        })

    # Email customer
    if customer_email:
        if action == "accept":
            date_str = booking.get("preferred_date", "")
            time_str = booking.get("preferred_time", "")
            event_dt = f"{date_str} {time_str}" if date_str and time_str else date_str
            asyncio.create_task(send_email_with_calendar(
                customer_email,
                f"Booking Confirmed — {booking.get('title')}",
                _email_booking_accepted_to_customer(
                    customer_name=customer_name,
                    contractor_name=contractor_name,
                    title=booking.get("title", ""),
                    booking_date=date_str,
                    booking_time=time_str,
                    address=booking.get("address", ""),
                    note=message,
                ),
                event_title=f"{booking.get('title')} with {contractor_name}",
                event_date=event_dt,
                event_location=booking.get("address", ""),
                event_description=booking.get("description", ""),
            ))
        else:
            asyncio.create_task(send_email(
                customer_email,
                f"Booking update — {booking.get('title')}",
                _email_booking_declined_to_customer(
                    customer_name=customer_name,
                    contractor_name=contractor_name,
                    title=booking.get("title", ""),
                    note=message,
                ),
            ))

    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated or {"status": new_status}


# ─────────────────────── EMAIL TEMPLATES ───────────────────────

def _email_booking_request_to_contractor(
    *, contractor_name: str, customer_name: str, title: str,
    booking_date: str, booking_time: str, notes: str,
    address: str, booking_id: str,
) -> str:
    notes_block = f"<p style=\"margin:8px 0 0;color:#555;\"><strong>Notes:</strong> {notes}</p>" if notes else ""
    addr_block = f"<p style=\"margin:4px 0;color:#1A2F3A;\"><strong>Location:</strong> {address}</p>" if address else ""
    return f"""{email_wrapper_start("Booking Request")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#2563eb;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">New Booking Request</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {contractor_name},</h2>
        <p style="color:#555;line-height:1.6;">{customer_name} has requested a booking. Review the details and accept or decline from your dashboard.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Service:</strong> {title}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Date:</strong> {booking_date}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Time:</strong> {booking_time}</p>
          {addr_block}
          {notes_block}
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/dashboard?tab=bookings&booking={booking_id}" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Review &amp; Respond</a>
        </div>
        <p style="color:#888;font-size:13px;">Tip: Respond within 24 hours — customers usually move on after that.</p>
    {email_wrapper_end()}"""


def _email_booking_request_to_customer(
    *, customer_name: str, contractor_name: str, title: str,
    booking_date: str, booking_time: str,
) -> str:
    return f"""{email_wrapper_start("Booking Request Sent")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#f59e0b;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">Pending Confirmation</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {customer_name},</h2>
        <p style="color:#555;line-height:1.6;">We've sent your booking request to <strong>{contractor_name}</strong>. You'll get a confirmation as soon as they respond — usually within a few hours.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Service:</strong> {title}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Date:</strong> {booking_date}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Time:</strong> {booking_time}</p>
        </div>
    {email_wrapper_end()}"""


def _email_booking_accepted_to_customer(
    *, customer_name: str, contractor_name: str, title: str,
    booking_date: str, booking_time: str, address: str, note: Optional[str],
) -> str:
    addr_block = f"<p style=\"margin:4px 0;color:#1A2F3A;\"><strong>Location:</strong> {address}</p>" if address else ""
    note_block = f"<p style=\"margin:12px 0 0;color:#1A2F3A;font-style:italic;\">&ldquo;{note}&rdquo; — {contractor_name}</p>" if note else ""
    return f"""{email_wrapper_start("Booking Confirmed")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#22c55e;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">&#10003; Confirmed</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {customer_name}!</h2>
        <p style="color:#555;line-height:1.6;">Great news — <strong>{contractor_name}</strong> has confirmed your booking.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Service:</strong> {title}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Date:</strong> {booking_date}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Time:</strong> {booking_time}</p>
          {addr_block}
          {note_block}
        </div>
        <div style="background:#EFF6FF;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#1E40AF;font-size:14px;">&#128197; <strong>Add to Calendar</strong></p>
          <p style="margin:8px 0 0;color:#1E40AF;font-size:13px;">A calendar invite (.ics file) is attached to this email.</p>
        </div>
    {email_wrapper_end()}"""


def _email_booking_declined_to_customer(
    *, customer_name: str, contractor_name: str, title: str, note: Optional[str],
) -> str:
    note_block = f"<p style=\"margin:12px 0 0;color:#555;font-style:italic;\">&ldquo;{note}&rdquo; — {contractor_name}</p>" if note else ""
    return f"""{email_wrapper_start("Booking Update")}
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {customer_name},</h2>
        <p style="color:#555;line-height:1.6;">Unfortunately, <strong>{contractor_name}</strong> is unable to take your booking for <strong>{title}</strong> at the requested time.</p>
        {note_block}
        <p style="color:#555;line-height:1.6;margin-top:20px;">You can browse other providers or try a different time slot.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/contractors" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Find Another Provider</a>
        </div>
    {email_wrapper_end()}"""
