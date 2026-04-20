"""Contractors router - Profiles, Services, Bookings, Jobs, Bids, Reviews"""
import os
import uuid
import asyncio
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Body
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

from db import db
from services.email import (
    send_email, email_booking_confirmed, email_job_request_confirmation,
    email_new_lead_notification, email_bid_received
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["contractors"])


# ========== MODELS ==========

class ContractorProfileCreate(BaseModel):
    business_name: Optional[str] = None  # optional — falls back to user's name if blank
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class ContractorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    business_name: str = ""
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    portfolio_images: List[str] = []
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    completed_jobs: int = 0
    verified: bool = False
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContractorServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    price_type: str = "fixed"
    price: Optional[float] = None
    duration_estimate: Optional[str] = None


class ContractorService(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contractor_id: str
    title: str
    description: str
    category: str
    price_type: str = "fixed"
    price: Optional[float] = None
    duration_estimate: Optional[str] = None
    images: List[str] = []
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ServiceBookingCreate(BaseModel):
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    notes: Optional[str] = None


class ServiceBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    status: str = "pending"
    amount: Optional[float] = None
    payment_status: str = "unpaid"
    payment_session_id: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReviewCreate(BaseModel):
    rating: int
    review: str


class JobPostCreate(BaseModel):
    title: str
    category: str
    description: str
    address: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_date: Optional[str] = None
    urgency: str = "flexible"
    images: Optional[List[str]] = []
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    answers: Optional[Dict[str, Any]] = {}


class JobBidCreate(BaseModel):
    amount: float
    message: str
    estimated_duration: Optional[str] = None
    available_date: Optional[str] = None


# ========== CONTRACTOR PROFILES ==========

def _fallback_business_name(user: Optional[Dict[str, Any]]) -> str:
    """If the contractor didn't set a business name, display their own name."""
    if not user:
        return "Service Provider"
    full = (user.get("full_name") or user.get("name") or "").strip()
    if full:
        return f"{full}'s Services"
    email = user.get("email") or ""
    if "@" in email:
        return f"{email.split('@')[0].title()}'s Services"
    return "Service Provider"


@router.post("/contractors/profile")
async def create_contractor_profile(user_id: str, profile: ContractorProfileCreate):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})

    existing = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if existing:
        update_data = profile.model_dump()
        # If the landlord wipes business_name, auto-fill it from their user record
        if not (update_data.get("business_name") or "").strip():
            update_data["business_name"] = _fallback_business_name(user)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.contractor_profiles.update_one({"user_id": user_id}, {"$set": update_data})
        updated = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
        return updated

    profile_data = profile.model_dump()
    # Auto-fill business_name if blank (so creating a profile has zero required fields)
    if not (profile_data.get("business_name") or "").strip():
        profile_data["business_name"] = _fallback_business_name(user)

    profile_obj = ContractorProfile(user_id=user_id, **profile_data)
    if user:
        profile_obj.email = profile.email or user.get("email")
    doc = profile_obj.model_dump()
    await db.contractor_profiles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/contractors/profile/{user_id}")
async def get_contractor_profile(user_id: str):
    profile = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/contractors/search")
async def search_contractors(
    specialty: Optional[str] = None,
    area: Optional[str] = None,
    min_rating: Optional[float] = None,
    q: Optional[str] = None
):
    query = {"status": "active"}
    if specialty:
        query["specialties"] = {"$regex": specialty, "$options": "i"}
    if area:
        query["service_areas"] = {"$regex": area, "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if q:
        query["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"specialties": {"$regex": q, "$options": "i"}}
        ]

    profiles = await db.contractor_profiles.find(query, {"_id": 0}).to_list(100)
    for p in profiles:
        user = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        if user:
            p["user_name"] = user.get("name", "")
    return profiles


@router.put("/contractors/profile/{user_id}/images")
async def update_contractor_images(user_id: str, images: List[str]):
    await db.contractor_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"portfolio_images": images, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}


@router.post("/contractors/verify-document")
async def verify_contractor_document(
    file: UploadFile = File(...),
    document_type: str = Body(...),
    contractor_id: str = Body(...)
):
    import base64
    file_content = await file.read()
    file_base64 = base64.b64encode(file_content).decode('utf-8')
    file_extension = file.filename.split('.')[-1].lower() if file.filename else 'pdf'

    media_types = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
    media_type = media_types.get(file_extension, 'application/pdf')

    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="AI verification not configured")

    verification_prompts = {
        'wcb_clearance': """Analyze this document and determine if it is a valid WorkSafeBC (WCB) clearance certificate.
Check for: 1. WorkSafeBC or WCB logo/header 2. Clearance letter 3. Account number 4. Date of issuance 5. Business name
Respond in JSON: {"is_valid": true/false, "document_type": "wcb_clearance", "confidence": 0-100, "business_name": "", "account_number": "", "issue_date": "", "reason": ""}""",
        'insurance': """Analyze this document and determine if it is a valid commercial liability insurance certificate.
Check for: 1. Insurance company 2. Certificate type 3. Coverage type 4. Policy number 5. Coverage amounts 6. Expiration date 7. Named insured
Respond in JSON: {"is_valid": true/false, "document_type": "insurance", "confidence": 0-100, "insurance_company": "", "policy_number": "", "coverage_amount": "", "expiration_date": "", "business_name": "", "reason": ""}"""
    }

    prompt = verification_prompts.get(document_type, verification_prompts['insurance'])

    try:
        import httpx
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            response = await http_client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image" if media_type.startswith('image') else "document", "source": {"type": "base64", "media_type": media_type, "data": file_base64}},
                            {"type": "text", "text": prompt}
                        ]
                    }]
                }
            )

            if response.status_code != 200:
                logger.error(f"Claude API error: {response.text}")
                raise HTTPException(status_code=500, detail="AI verification failed")

            result = response.json()
            ai_response = result.get("content", [{}])[0].get("text", "{}")

            try:
                verification_result = json.loads(ai_response)
            except Exception:
                import re
                json_match = re.search(r'\{[^{}]*\}', ai_response, re.DOTALL)
                if json_match:
                    verification_result = json.loads(json_match.group())
                else:
                    verification_result = {"is_valid": False, "reason": "Could not parse AI response"}

            is_valid = verification_result.get("is_valid", False)
            confidence = verification_result.get("confidence", 0)

            if is_valid and confidence >= 70:
                update_field = "wcb_verified" if document_type == "wcb_clearance" else "insurance_verified"
                doc_url_field = "wcb_doc_url" if document_type == "wcb_clearance" else "insurance_doc_url"
                await db.contractor_profiles.update_one(
                    {"user_id": contractor_id},
                    {"$set": {update_field: True, doc_url_field: f"verified_{document_type}_{contractor_id}", f"{document_type}_details": verification_result, "updated_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
                return {"verified": True, "document_type": document_type, "confidence": confidence, "details": verification_result}
            else:
                return {"verified": False, "document_type": document_type, "confidence": confidence, "reason": verification_result.get("reason", "Verification failed")}

    except Exception as e:
        logger.error(f"Document verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# ========== CONTRACTOR SERVICES ==========

@router.post("/contractors/services")
async def create_contractor_service(contractor_id: str, service: ContractorServiceCreate):
    service_obj = ContractorService(contractor_id=contractor_id, **service.model_dump())
    doc = service_obj.model_dump()
    await db.contractor_services.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/contractors/{contractor_id}/services")
async def get_contractor_services(contractor_id: str):
    services = await db.contractor_services.find({"contractor_id": contractor_id, "status": "active"}, {"_id": 0}).to_list(50)
    return services


@router.get("/services/search")
async def search_services(category: Optional[str] = None, q: Optional[str] = None, max_price: Optional[float] = None):
    query = {"status": "active"}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if q:
        query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
    if max_price:
        query["price"] = {"$lte": max_price}

    services = await db.contractor_services.find(query, {"_id": 0}).to_list(100)
    for s in services:
        profile = await db.contractor_profiles.find_one({"contractor_id": s["contractor_id"]}, {"_id": 0, "business_name": 1, "rating": 1, "avatar": 1})
        if not profile:
            profile = await db.contractor_profiles.find_one({"user_id": s["contractor_id"]}, {"_id": 0, "business_name": 1, "rating": 1, "avatar": 1})
        s["contractor"] = profile or {}
    return services


@router.delete("/contractors/services/{service_id}")
async def delete_contractor_service(service_id: str, contractor_id: str):
    await db.contractor_services.update_one({"id": service_id, "contractor_id": contractor_id}, {"$set": {"status": "deleted"}})
    return {"status": "deleted"}


# ========== SERVICE BOOKINGS ==========

@router.post("/bookings")
async def create_booking(customer_id: str, booking: ServiceBookingCreate):
    booking_obj = ServiceBooking(customer_id=customer_id, **booking.model_dump())
    if booking.service_id:
        service = await db.contractor_services.find_one({"id": booking.service_id}, {"_id": 0})
        if service and service.get("price"):
            booking_obj.amount = service["price"]

    doc = booking_obj.model_dump()
    await db.bookings.insert_one(doc)

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": booking.contractor_id,
        "title": "New Booking Request",
        "body": f"New booking: {booking.title}",
        "type": "booking",
        "data": {"booking_id": booking_obj.id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    doc.pop("_id", None)
    return doc


@router.get("/bookings/customer/{customer_id}")
async def get_customer_bookings(customer_id: str):
    bookings = await db.bookings.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for b in bookings:
        profile = await db.contractor_profiles.find_one({"user_id": b["contractor_id"]}, {"_id": 0, "business_name": 1, "avatar": 1})
        b["contractor"] = profile or {}
    return bookings


@router.get("/bookings/contractor/{contractor_id}")
async def get_contractor_bookings(contractor_id: str):
    bookings = await db.bookings.find({"contractor_id": contractor_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for b in bookings:
        user = await db.users.find_one({"id": b["customer_id"]}, {"_id": 0, "name": 1, "email": 1})
        b["customer"] = user or {}
    return bookings


@router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, user_id: str):
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}})

    notify_user = booking["customer_id"] if user_id == booking["contractor_id"] else booking["contractor_id"]
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": notify_user,
        "title": f"Booking {status.replace('_', ' ').title()}",
        "body": f"Booking '{booking['title']}' is now {status.replace('_', ' ')}",
        "type": "booking",
        "data": {"booking_id": booking_id, "status": status},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    if status == "confirmed":
        customer = await db.users.find_one({"id": booking["customer_id"]}, {"_id": 0})
        contractor_profile = await db.contractor_profiles.find_one({"user_id": booking["contractor_id"]}, {"_id": 0})
        if customer and customer.get("email"):
            asyncio.create_task(send_email(
                customer["email"],
                f"Booking Confirmed - {booking['title']}",
                email_booking_confirmed(
                    customer.get("name", ""),
                    contractor_profile.get("business_name", "") if contractor_profile else "",
                    booking["title"],
                    booking.get("preferred_date", "")
                )
            ))

    return {"status": "updated"}


@router.post("/bookings/{booking_id}/pay")
async def pay_booking(request: Request, booking_id: str):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not booking.get("amount"):
        raise HTTPException(status_code=400, detail="No amount set for this booking")

    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    origin = request.headers.get('origin', host_url)
    success_url = f"{origin}/dashboard?payment=success&booking_id={booking_id}&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/dashboard?payment=cancelled"

    checkout_request = CheckoutSessionRequest(
        amount=float(booking["amount"]),
        currency="cad",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"booking_id": booking_id, "contractor_id": booking["contractor_id"]}
    )

    session = await stripe_checkout.create_checkout_session(checkout_request)
    await db.bookings.update_one({"id": booking_id}, {"$set": {"payment_session_id": session.session_id}})

    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": booking["customer_id"],
        "amount": booking["amount"],
        "currency": "cad",
        "description": f"Booking: {booking['title']}",
        "recipient_id": booking["contractor_id"],
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)

    return {"url": session.url, "session_id": session.session_id}


@router.post("/bookings/{booking_id}/review")
async def review_booking(booking_id: str, customer_id: str, review: ReviewCreate):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"rating": review.rating, "review": review.review, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    all_reviews = await db.bookings.find(
        {"contractor_id": booking["contractor_id"], "rating": {"$exists": True, "$ne": None}},
        {"_id": 0, "rating": 1}
    ).to_list(500)

    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await db.contractor_profiles.update_one(
            {"user_id": booking["contractor_id"]},
            {"$set": {"rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
        )

    return {"status": "reviewed"}


@router.get("/contractors/{contractor_id}/reviews")
async def get_contractor_reviews(contractor_id: str, limit: int = 20):
    reviews = await db.bookings.find(
        {"contractor_id": contractor_id, "rating": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "customer_id": 1, "title": 1, "rating": 1, "review": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).to_list(limit)

    for r in reviews:
        user = await db.users.find_one({"id": r["customer_id"]}, {"_id": 0, "name": 1, "avatar": 1})
        r["customer"] = user or {"name": "Anonymous"}
    return reviews


@router.get("/contractors/leaderboard")
async def get_contractor_leaderboard(limit: int = 10):
    contractors = await db.contractor_profiles.find(
        {"status": "active", "rating": {"$gt": 0}},
        {"_id": 0, "id": 1, "user_id": 1, "business_name": 1, "avatar": 1, "rating": 1, "review_count": 1, "completed_jobs": 1, "specialties": 1, "verified": 1, "service_areas": 1}
    ).sort([("rating", -1), ("review_count", -1)]).to_list(limit)
    return contractors


# ========== JOB POSTING & BIDDING ==========

@router.post("/jobs")
async def create_job_post(job: JobPostCreate, user_id: str):
    user = None
    user_name = "Guest"
    if user_id != 'guest':
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            user_name = user.get("name", "Anonymous")

    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "user_id": user_id,
        "user_name": user_name,
        "title": job.title,
        "category": job.category.lower(),
        "description": job.description,
        "address": job.address,
        "budget_min": job.budget_min,
        "budget_max": job.budget_max,
        "preferred_date": job.preferred_date,
        "urgency": job.urgency,
        "images": job.images or [],
        "status": "open",
        "bid_count": 0,
        "contact_email": job.contact_email,
        "contact_name": job.contact_name,
        "contact_phone": job.contact_phone,
        "answers": job.answers or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_posts.insert_one(job_doc)

    if job.contact_email:
        asyncio.create_task(send_email(
            job.contact_email,
            f"Your Request is Live - {job.title}",
            email_job_request_confirmation(job.contact_name or user_name, job.title, job.address, job.answers)
        ))

    contractors = await db.contractor_profiles.find(
        {"specialties": {"$in": [job.category.lower()]}, "status": "active"},
        {"_id": 0, "user_id": 1, "business_name": 1}
    ).to_list(50)

    for c in contractors:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": c["user_id"],
            "title": "New Job Opportunity",
            "body": f"New job posted: {job.title}",
            "type": "job_post",
            "data": {"job_id": job_id},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        contractor_user = await db.users.find_one({"id": c["user_id"]}, {"_id": 0, "email": 1})
        if contractor_user and contractor_user.get("email"):
            asyncio.create_task(send_email(
                contractor_user["email"],
                f"New Lead: {job.title} in {job.address}",
                email_new_lead_notification(c.get("business_name", "Professional"), job.title, job.address, job.description, job_id)
            ))

    job_doc.pop("_id", None)
    return job_doc


@router.get("/jobs")
async def get_job_posts(category: Optional[str] = None, status: str = "open", limit: int = 20, skip: int = 0):
    query = {"status": status}
    if category:
        query["category"] = category.lower()
    jobs = await db.job_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for job in jobs:
        bids = await db.job_bids.count_documents({"job_id": job["id"]})
        job["bid_count"] = bids
    return jobs


@router.get("/jobs/{job_id}")
async def get_job_post(job_id: str):
    job = await db.job_posts.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    bids = await db.job_bids.find({"job_id": job_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for bid in bids:
        contractor = await db.contractor_profiles.find_one(
            {"user_id": bid["contractor_id"]},
            {"_id": 0, "business_name": 1, "avatar": 1, "rating": 1, "review_count": 1, "verified": 1}
        )
        bid["contractor"] = contractor or {}
    job["bids"] = bids
    return job


@router.get("/jobs/user/{user_id}")
async def get_user_job_posts(user_id: str, status: Optional[str] = None):
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    jobs = await db.job_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    for job in jobs:
        bids = await db.job_bids.count_documents({"job_id": job["id"]})
        job["bid_count"] = bids
    return jobs


@router.post("/jobs/{job_id}/bids")
async def create_job_bid(job_id: str, bid: JobBidCreate, contractor_id: str):
    job = await db.job_posts.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is no longer accepting bids")

    contractor = await db.contractor_profiles.find_one({"user_id": contractor_id}, {"_id": 0})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor profile not found")

    existing = await db.job_bids.find_one({"job_id": job_id, "contractor_id": contractor_id})
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a bid for this job")

    bid_id = str(uuid.uuid4())
    bid_doc = {
        "id": bid_id,
        "job_id": job_id,
        "contractor_id": contractor_id,
        "amount": bid.amount,
        "message": bid.message,
        "estimated_duration": bid.estimated_duration,
        "available_date": bid.available_date,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_bids.insert_one(bid_doc)

    await db.job_posts.update_one({"id": job_id}, {"$inc": {"bid_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})

    if job["user_id"] != "guest":
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": job["user_id"],
            "title": "New Bid Received",
            "body": f"{contractor.get('business_name', 'A contractor')} submitted a bid of ${bid.amount}",
            "type": "job_bid",
            "data": {"job_id": job_id, "bid_id": bid_id},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    customer_email = job.get("contact_email")
    if customer_email:
        asyncio.create_task(send_email(
            customer_email,
            f"New Quote: ${bid.amount:.2f} for {job['title']}",
            email_bid_received(job.get("contact_name", "Customer"), contractor.get("business_name", "Professional"), bid.amount, job["title"], bid.message)
        ))

    bid_doc.pop("_id", None)
    return bid_doc


@router.get("/jobs/{job_id}/bids")
async def get_job_bids(job_id: str):
    bids = await db.job_bids.find({"job_id": job_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for bid in bids:
        contractor = await db.contractor_profiles.find_one(
            {"user_id": bid["contractor_id"]},
            {"_id": 0, "business_name": 1, "avatar": 1, "rating": 1, "review_count": 1, "verified": 1, "completed_jobs": 1}
        )
        bid["contractor"] = contractor or {}
    return bids


@router.put("/jobs/{job_id}/bids/{bid_id}/accept")
async def accept_job_bid(job_id: str, bid_id: str, user_id: str):
    job = await db.job_posts.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    bid = await db.job_bids.find_one({"id": bid_id, "job_id": job_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    await db.job_bids.update_one({"id": bid_id}, {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()}})
    await db.job_bids.update_many({"job_id": job_id, "id": {"$ne": bid_id}}, {"$set": {"status": "rejected"}})

    await db.job_posts.update_one(
        {"id": job_id},
        {"$set": {"status": "in_progress", "accepted_bid_id": bid_id, "accepted_contractor_id": bid["contractor_id"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "customer_id": user_id,
        "contractor_id": bid["contractor_id"],
        "job_id": job_id,
        "title": job["title"],
        "description": job["description"],
        "address": job["address"],
        "amount": bid["amount"],
        "status": "confirmed",
        "preferred_date": bid.get("available_date") or job.get("preferred_date"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": bid["contractor_id"],
        "title": "Bid Accepted!",
        "body": f"Your bid of ${bid['amount']} for '{job['title']}' was accepted",
        "type": "bid_accepted",
        "data": {"job_id": job_id, "bid_id": bid_id, "booking_id": booking_id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"status": "accepted", "booking_id": booking_id}


@router.put("/jobs/{job_id}/cancel")
async def cancel_job_post(job_id: str, user_id: str):
    job = await db.job_posts.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.job_posts.update_one({"id": job_id}, {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "cancelled"}


@router.get("/contractors/{contractor_id}/bids")
async def get_contractor_bids(contractor_id: str, status: Optional[str] = None):
    query = {"contractor_id": contractor_id}
    if status:
        query["status"] = status
    bids = await db.job_bids.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    for bid in bids:
        job = await db.job_posts.find_one({"id": bid["job_id"]}, {"_id": 0, "title": 1, "category": 1, "address": 1, "status": 1})
        bid["job"] = job or {}
    return bids
