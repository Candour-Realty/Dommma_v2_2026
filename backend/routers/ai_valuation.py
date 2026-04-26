"""AI Property Valuation, Neighborhood Comparison & Smart Rent Pricing"""
import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/ai", tags=["ai-valuation"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


@router.post("/property-valuation")
async def ai_property_valuation(
    address: str = "",
    city: str = "Vancouver",
    property_type: str = "Apartment",
    bedrooms: int = 1,
    bathrooms: int = 1,
    sqft: int = 600,
    year_built: int = 2000,
    amenities: str = ""
):
    """AI-powered property valuation based on comparable listings and market data"""
    
    # Fetch comparable listings from database
    comps_query = {
        "city": {"$regex": city, "$options": "i"},
        "bedrooms": {"$gte": bedrooms - 1, "$lte": bedrooms + 1},
    }
    comparables = await db.listings.find(comps_query, {"_id": 0}).to_list(50)
    
    rent_prices = [c.get("price", 0) for c in comparables if c.get("listing_type") == "rent" and c.get("price", 0) > 0]
    sale_prices = [c.get("price", 0) for c in comparables if c.get("listing_type") == "sale" and c.get("price", 0) > 0]
    
    avg_rent = sum(rent_prices) / len(rent_prices) if rent_prices else 0
    avg_sale = sum(sale_prices) / len(sale_prices) if sale_prices else 0
    
    # Size-based adjustments
    sqft_factor = sqft / 700 if sqft > 0 else 1.0
    age_factor = max(0.85, 1.0 - (2026 - year_built) * 0.003)
    bath_factor = 1.0 + (bathrooms - 1) * 0.08
    
    estimated_rent = round(avg_rent * sqft_factor * age_factor * bath_factor) if avg_rent > 0 else None
    estimated_sale = round(avg_sale * sqft_factor * age_factor * bath_factor) if avg_sale > 0 else None
    
    # Use AI for deeper analysis if available
    ai_analysis = None
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key and (estimated_rent or estimated_sale):
        try:
            from anthropic import AsyncAnthropic
            ai_client = AsyncAnthropic(api_key=anthropic_key)
            
            prompt = f"""As a Vancouver real estate analyst, provide a brief property valuation for:
- Address: {address or 'Not specified'}, {city}
- Type: {property_type}, {bedrooms}BR/{bathrooms}BA, {sqft}sqft, built {year_built}
- Amenities: {amenities or 'Standard'}
- Comparable avg rent: ${avg_rent:.0f}/mo ({len(rent_prices)} comps)
- Comparable avg sale: ${avg_sale:.0f} ({len(sale_prices)} comps)

Provide: 1) Market position assessment (2 sentences), 2) Key value drivers, 3) Recommended listing price range.
Respond in JSON: {{"assessment": "...", "value_drivers": ["..."], "rent_range": {{"low": 0, "high": 0}}, "sale_range": {{"low": 0, "high": 0}}, "market_trend": "rising|stable|declining"}}"""

            response = await ai_client.messages.create(
                model="claude-sonnet-4-20250514", max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )
            import json
            text = response.content[0].text
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start >= 0:
                ai_analysis = json.loads(text[json_start:json_end])
        except Exception as e:
            logger.warning(f"AI valuation analysis failed: {e}")
    
    return {
        "address": address,
        "city": city,
        "property_type": property_type,
        "specs": {"bedrooms": bedrooms, "bathrooms": bathrooms, "sqft": sqft, "year_built": year_built},
        "estimated_rent": estimated_rent,
        "estimated_sale_price": estimated_sale,
        "comparables_count": {"rent": len(rent_prices), "sale": len(sale_prices)},
        "market_averages": {"avg_rent": round(avg_rent), "avg_sale": round(avg_sale)},
        "adjustments": {"size": round(sqft_factor, 2), "age": round(age_factor, 2), "bathrooms": round(bath_factor, 2)},
        "ai_analysis": ai_analysis,
        "confidence": "high" if len(rent_prices) >= 10 else "medium" if len(rent_prices) >= 5 else "low"
    }


@router.get("/neighborhood-comparison")
async def neighborhood_comparison(neighborhoods: str = "Downtown,Kitsilano,Mount Pleasant"):
    """Compare neighborhoods based on listings data"""
    areas = [n.strip() for n in neighborhoods.split(",")]
    results = []
    
    for area in areas:
        listings = await db.listings.find(
            {"$or": [
                {"address": {"$regex": area, "$options": "i"}},
                {"city": {"$regex": area, "$options": "i"}},
                {"neighborhood": {"$regex": area, "$options": "i"}}
            ]},
            {"_id": 0}
        ).to_list(100)
        
        rent_listings = [l for l in listings if l.get("listing_type") == "rent"]
        sale_listings = [l for l in listings if l.get("listing_type") == "sale"]
        
        rent_prices = [l["price"] for l in rent_listings if l.get("price", 0) > 0]
        sale_prices = [l["price"] for l in sale_listings if l.get("price", 0) > 0]
        
        pet_friendly = sum(1 for l in listings if l.get("pet_friendly"))
        avg_sqft = sum(l.get("sqft", 0) for l in listings if l.get("sqft")) / max(1, sum(1 for l in listings if l.get("sqft")))
        
        results.append({
            "neighborhood": area,
            "total_listings": len(listings),
            "rent": {
                "count": len(rent_listings),
                "avg_price": round(sum(rent_prices) / len(rent_prices)) if rent_prices else 0,
                "min_price": min(rent_prices) if rent_prices else 0,
                "max_price": max(rent_prices) if rent_prices else 0,
            },
            "sale": {
                "count": len(sale_listings),
                "avg_price": round(sum(sale_prices) / len(sale_prices)) if sale_prices else 0,
                "min_price": min(sale_prices) if sale_prices else 0,
                "max_price": max(sale_prices) if sale_prices else 0,
            },
            "avg_sqft": round(avg_sqft),
            "pet_friendly_pct": round(pet_friendly / max(1, len(listings)) * 100),
            "property_types": list(set(l.get("property_type", "Unknown") for l in listings))
        })
    
    return {"neighborhoods": results, "compared_at": datetime.now(timezone.utc).isoformat()}


@router.post("/smart-rent-pricing")
async def smart_rent_pricing(
    property_id: str = None,
    city: str = "Vancouver",
    bedrooms: int = 1,
    bathrooms: int = 1,
    sqft: int = 600,
    property_type: str = "Apartment",
    amenities: str = "",
    current_rent: float = 0
):
    """AI-powered smart rent price suggestion based on market data"""
    
    if property_id:
        prop = await db.listings.find_one({"id": property_id}, {"_id": 0})
        if prop:
            city = prop.get("city", city)
            bedrooms = prop.get("bedrooms", bedrooms)
            bathrooms = prop.get("bathrooms", bathrooms)
            sqft = prop.get("sqft", sqft)
            property_type = prop.get("property_type", property_type)
            current_rent = prop.get("price", current_rent)
    
    comps = await db.listings.find({
        "listing_type": "rent",
        "city": {"$regex": city, "$options": "i"},
        "bedrooms": {"$gte": bedrooms - 1, "$lte": bedrooms + 1},
        "price": {"$gt": 0}
    }, {"_id": 0}).to_list(100)
    
    prices = sorted([c["price"] for c in comps])

    # Regional baselines — fallback when we don't have enough comparables yet.
    # Metro Vancouver 2025 averages (1BR base per bedroom count).
    VANCOUVER_BASELINES = {0: 1600, 1: 2000, 2: 2600, 3: 3400, 4: 4200, 5: 5000}
    CITY_MULTIPLIERS = {
        "vancouver": 1.0, "burnaby": 0.88, "richmond": 0.90, "surrey": 0.72,
        "coquitlam": 0.82, "new westminster": 0.85, "north vancouver": 0.95,
        "west vancouver": 1.15, "delta": 0.75, "langley": 0.68, "maple ridge": 0.65,
        "port coquitlam": 0.78, "port moody": 0.88,
    }

    source = "comparables"
    if len(prices) >= 3:
        median = prices[len(prices) // 2]
        p25 = prices[len(prices) // 4]
        p75 = prices[3 * len(prices) // 4]
        avg = sum(prices) / len(prices)
    else:
        # Not enough data — synthesize a baseline
        source = "baseline" if not prices else "hybrid"
        base = VANCOUVER_BASELINES.get(bedrooms, 2600)
        city_mult = CITY_MULTIPLIERS.get(city.lower().strip(), 0.85)
        baseline = base * city_mult
        # Blend baseline with any sparse comparable data we do have
        if prices:
            baseline = (baseline + sum(prices) / len(prices)) / 2
        median = baseline
        avg = baseline
        p25 = baseline * 0.88
        p75 = baseline * 1.12

    # Sqft adjustment with diminishing returns + safety cap.
    # Rent does NOT scale linearly with sqft (a 2x bigger unit isn't 2x the rent).
    # We use a 0.4 power law (research-backed for rental markets) so doubling sqft
    # adds ~32% rent, tripling adds ~55%. Then cap to ±50% so a 5,000 sqft mansion
    # doesn't ever 6x the median.
    if sqft > 0:
        # Use comparable-set average sqft as the baseline if we have it,
        # otherwise fall back to 850 (typical 1-2BR Metro Van).
        comp_sqfts = [c.get("sqft", 0) for c in comps if c.get("sqft", 0) > 0]
        baseline_sqft = (sum(comp_sqfts) / len(comp_sqfts)) if comp_sqfts else 850
        ratio = sqft / baseline_sqft
        sqft_adj = ratio ** 0.4
        sqft_adj = max(0.65, min(1.5, sqft_adj))  # hard cap
    else:
        sqft_adj = 1.0

    # Bathroom adjustment — small bump per extra bath, capped
    bath_adj = min(1.20, 1.0 + max(0, (bathrooms - 1)) * 0.05)
    suggested = round(median * sqft_adj * bath_adj)

    competitive = round(suggested * 0.95)
    premium = round(suggested * 1.08)
    
    position = "below_market" if current_rent and current_rent < p25 else \
               "at_market" if current_rent and p25 <= current_rent <= p75 else \
               "above_market" if current_rent and current_rent > p75 else "unknown"
    
    price_range_str = (
        f"${min(prices):,.0f} - ${max(prices):,.0f}" if prices
        else f"${round(p25):,.0f} - ${round(p75):,.0f}"
    )

    return {
        "suggested_rent": suggested,
        "competitive_price": competitive,
        "premium_price": premium,
        "source": source,  # "comparables" | "baseline" | "hybrid"
        "market_data": {
            "median": round(median),
            "average": round(avg),
            "p25": round(p25),
            "p75": round(p75),
            "count": len(prices),
            "range": price_range_str
        },
        "current_rent": current_rent,
        "current_position": position,
        "adjustments": {"sqft": round(sqft_adj, 2), "bathrooms": round(bath_adj, 2)},
        "recommendation": (
            f"Based on {len(prices)} comparable properties in {city}, we suggest ${suggested:,}/mo. "
            if source == "comparables"
            else f"Using {city} regional market baselines (more precise once nearby listings are indexed), we suggest ${suggested:,}/mo. "
        ) + (
            f"Your current rent is {position.replace('_', ' ')}." if position != "unknown" else ""
        )
    }


@router.get("/virtual-tours")
async def get_virtual_tours(listing_id: str = None, city: str = None):
    """Get virtual tour data for properties"""
    query = {}
    if listing_id:
        query["id"] = listing_id
    elif city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    listings = await db.listings.find(
        {**query, "$or": [
            {"virtual_tour_url": {"$exists": True, "$ne": ""}},
            {"video_tour_url": {"$exists": True, "$ne": ""}},
            {"images": {"$exists": True}},
        ]},
        {"_id": 0, "id": 1, "title": 1, "address": 1, "virtual_tour_url": 1, 
         "video_tour_url": 1, "images": 1, "price": 1, "bedrooms": 1}
    ).to_list(50)
    
    tours = []
    for l in listings:
        tour_data = {
            "listing_id": l["id"],
            "title": l.get("title", "Property"),
            "address": l.get("address", ""),
            "price": l.get("price", 0),
            "bedrooms": l.get("bedrooms", 0),
            "has_virtual_tour": bool(l.get("virtual_tour_url")),
            "virtual_tour_url": l.get("virtual_tour_url", ""),
            "has_video_tour": bool(l.get("video_tour_url")),
            "video_tour_url": l.get("video_tour_url", ""),
            "image_count": len(l.get("images", [])),
            "thumbnail": l.get("images", [None])[0]
        }
        tours.append(tour_data)
    
    return {"tours": tours, "total": len(tours)}


@router.post("/listings/{listing_id}/virtual-tour")
async def add_virtual_tour(listing_id: str, tour_url: str, tour_type: str = "matterport"):
    """Add a virtual tour URL to a listing"""
    result = await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "virtual_tour_url": tour_url,
            "virtual_tour_type": tour_type,
            "virtual_tour_added_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"status": "success", "message": "Virtual tour added"}
