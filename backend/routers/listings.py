"""Listings router - CRUD, Map, Claim, Featured, Mark-Rented"""
import os
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

from db import db
from services.auth_utils import hash_password
from services.email import send_email, email_welcome

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/listings", tags=["listings"])


# ========== MODELS ==========

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    address: str
    city: str
    province: str
    postal_code: str
    lat: float
    lng: float
    price: int
    bedrooms: int
    bathrooms: float
    sqft: int
    property_type: str
    description: str
    amenities: List[str]
    images: List[str]
    available_date: str = ""
    pet_friendly: bool = False
    parking: bool = False
    landlord_id: Optional[str] = None
    user_id: Optional[str] = None
    owner_id: Optional[str] = None
    listing_type: str = "rent"
    sale_price: Optional[int] = None
    year_built: Optional[int] = None
    lot_size: Optional[int] = None
    garage: Optional[int] = None
    mls_number: Optional[str] = None
    open_house_dates: List[str] = []
    status: str = "active"
    featured: bool = False
    matterport_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ListingCreate(BaseModel):
    title: str
    address: str
    city: str
    province: str
    postal_code: str
    lat: float
    lng: float
    price: int
    bedrooms: int
    bathrooms: float
    sqft: int
    property_type: str
    description: str
    amenities: List[str] = []
    images: List[str] = []
    available_date: str = ""
    pet_friendly: bool = False
    parking: bool = False
    listing_type: str = "rent"
    sale_price: Optional[int] = None
    year_built: Optional[int] = None
    lot_size: Optional[int] = None
    garage: Optional[int] = None
    mls_number: Optional[str] = None
    open_house_dates: List[str] = []
    lease_duration: Optional[int] = 12
    offers: List[str] = []
    matterport_id: Optional[str] = None


# ========== LISTING CRUD ==========

@router.get("")
async def get_listings(
    city: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[float] = None,
    property_type: Optional[str] = None,
    pet_friendly: Optional[bool] = None,
    parking: Optional[bool] = None,
    listing_type: Optional[str] = None,
    q: Optional[str] = None,
    owner_id: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = "newest",
    limit: int = 50,
    skip: int = 0
):
    query = {"status": "active"}
    if listing_type:
        query["listing_type"] = listing_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price:
        query["price"] = {"$gte": min_price}
    if max_price:
        query.setdefault("price", {})["$lte"] = max_price
    if bedrooms is not None:
        query["bedrooms"] = {"$gte": bedrooms}
    if bathrooms:
        query["bathrooms"] = {"$gte": bathrooms}
    if property_type:
        query["property_type"] = property_type
    if pet_friendly is not None:
        query["pet_friendly"] = pet_friendly
    if parking is not None:
        query["parking"] = parking
    if owner_id:
        query["$or"] = [{"owner_id": owner_id}, {"landlord_id": owner_id}, {"user_id": owner_id}]
    if featured is not None:
        query["featured"] = featured
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"address": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    sort_options = {
        "newest": [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "featured": [("featured", -1), ("boost_score", -1), ("created_at", -1)]
    }
    sort_by = sort_options.get(sort, sort_options["newest"])

    listings = await db.listings.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(min(limit, 100)).to_list(min(limit, 100))
    return listings


@router.get("/map")
async def get_listings_for_map(
    north_east_lat: Optional[float] = None,
    north_east_lng: Optional[float] = None,
    south_west_lat: Optional[float] = None,
    south_west_lng: Optional[float] = None
):
    query = {"status": "active"}
    if all([north_east_lat, north_east_lng, south_west_lat, south_west_lng]):
        query["lat"] = {"$gte": south_west_lat, "$lte": north_east_lat}
        query["lng"] = {"$gte": south_west_lng, "$lte": north_east_lng}

    listings = await db.listings.find(query, {"_id": 0}).to_list(100)
    return listings


@router.get("/claim")
async def claim_listing(token: str):
    listing = await db.listings.find_one({"claim_token": token}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Invalid or expired claim token")
    if listing.get("status") != "pending_claim":
        raise HTTPException(status_code=400, detail="This listing has already been claimed")
    return {
        "listing_id": listing["id"],
        "title": listing["title"],
        "address": listing["address"],
        "city": listing["city"],
        "price": listing["price"],
        "bedrooms": listing["bedrooms"],
        "bathrooms": listing["bathrooms"],
        "claim_email": listing.get("claim_email")
    }


@router.post("/claim")
async def complete_listing_claim(request: Request, data: Dict[str, Any]):
    token = data.get("token")
    password = data.get("password")
    name = data.get("name")

    if not token or not password:
        raise HTTPException(status_code=400, detail="Token and password are required")

    listing = await db.listings.find_one({"claim_token": token})
    if not listing:
        raise HTTPException(status_code=404, detail="Invalid or expired claim token")
    if listing.get("status") != "pending_claim":
        raise HTTPException(status_code=400, detail="This listing has already been claimed")

    claim_email = listing.get("claim_email")
    if not claim_email:
        raise HTTPException(status_code=400, detail="No email associated with this listing")

    existing_user = await db.users.find_one({"email": claim_email})

    if existing_user:
        user_id = existing_user["id"]
    else:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": claim_email,
            "name": name or claim_email.split('@')[0],
            "user_type": "landlord",
            "email_verified": True,
            "password_hash": hash_password(password),
            "preferences": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        asyncio.create_task(send_email(
            claim_email,
            "Welcome to DOMMMA!",
            email_welcome(user["name"], "landlord")
        ))

    await db.listings.update_one(
        {"claim_token": token},
        {
            "$set": {"status": "active", "owner_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$unset": {"claim_token": "", "claim_email": ""}
        }
    )

    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"success": True, "message": "Listing claimed and published successfully!", "user": user_data, "listing_id": listing["id"]}


@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("")
async def create_listing_basic(listing: ListingCreate):
    listing_obj = Listing(**listing.model_dump())
    doc = listing_obj.model_dump()
    await db.listings.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ========== FEATURED LISTINGS ==========

FEATURED_FEE = 4999  # $49.99

@router.post("/{listing_id}/featured")
async def enable_featured_listing(listing_id: str, landlord_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("landlord_id") != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if listing.get("featured"):
        return {"success": True, "message": "Listing is already featured", "featured": True}

    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=30)

    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "featured": True,
            "featured_enabled_at": now.isoformat(),
            "featured_expires_at": expires.isoformat(),
            "featured_fee_pending": True,
            "boost_score": 100
        }}
    )

    return {
        "success": True,
        "message": "Listing is now featured! A $49.99 fee will be charged when the property is rented.",
        "featured": True,
        "expires_at": expires.isoformat(),
        "fee_pending": True,
        "fee_amount": FEATURED_FEE / 100
    }


@router.delete("/{listing_id}/featured")
async def disable_featured_listing(listing_id: str, landlord_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("landlord_id") != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"featured": False, "featured_fee_pending": False, "boost_score": 0}}
    )
    return {"success": True, "message": "Featured status disabled", "featured": False}


@router.post("/{listing_id}/mark-rented")
async def mark_listing_rented(listing_id: str, landlord_id: str):
    import stripe
    stripe.api_key = os.environ.get('STRIPE_API_KEY')

    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("landlord_id") != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = {"success": True, "status": "rented"}

    if listing.get("featured") and listing.get("featured_fee_pending"):
        landlord = await db.users.find_one({"id": landlord_id}, {"_id": 0})
        if landlord and landlord.get("stripe_customer_id"):
            try:
                customer = stripe.Customer.retrieve(landlord["stripe_customer_id"])
                default_pm = customer.invoice_settings.default_payment_method if customer.invoice_settings else None
                if default_pm:
                    payment_intent = stripe.PaymentIntent.create(
                        amount=FEATURED_FEE,
                        currency="cad",
                        customer=landlord["stripe_customer_id"],
                        payment_method=default_pm,
                        confirm=True,
                        description=f"DOMMMA Featured Listing Fee - {listing['title']}",
                        automatic_payment_methods={"enabled": True, "allow_redirects": "never"}
                    )
                    result["featured_fee_charged"] = payment_intent.status == "succeeded"
            except Exception as e:
                logger.error(f"Featured fee charge error: {e}")
                result["featured_fee_error"] = str(e)

    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "rented",
            "featured": False,
            "featured_fee_pending": False,
            "rented_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return result


@router.get("/{listing_id}/featured-status")
async def get_featured_status(listing_id: str):
    listing = await db.listings.find_one(
        {"id": listing_id},
        {"_id": 0, "featured": 1, "featured_enabled_at": 1, "featured_expires_at": 1, "featured_fee_pending": 1, "boost_score": 1}
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
