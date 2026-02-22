"""
Fix Listings Script - Repairs missing fields in listings
Run: python fix_listings.py

Fixes:
- Adds listing_type to listings missing it (defaults to 'rent')
- Adds lat/lng coordinates to listings missing them
"""

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import random
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "dommma")


async def fix():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Fix listings missing listing_type (set to rent)
    result1 = await db.listings.update_many(
        {"listing_type": {"$exists": False}},
        {"$set": {"listing_type": "rent"}}
    )
    print(f"✅ Added listing_type to {result1.modified_count} listings")
    
    # Fix listings missing lat/lng (set Vancouver coords with slight variation)
    listings = await db.listings.find({"lat": {"$exists": False}}).to_list(1000)
    for listing in listings:
        await db.listings.update_one(
            {"id": listing["id"]},
            {"$set": {
                "lat": 49.2827 + random.uniform(-0.05, 0.05),
                "lng": -123.1207 + random.uniform(-0.05, 0.05)
            }}
        )
    print(f"✅ Added coordinates to {len(listings)} listings")
    
    # Summary
    total = await db.listings.count_documents({})
    with_type = await db.listings.count_documents({"listing_type": {"$exists": True}})
    with_coords = await db.listings.count_documents({"lat": {"$exists": True}})
    
    print(f"\n=== Summary ===")
    print(f"Total listings: {total}")
    print(f"With listing_type: {with_type}")
    print(f"With coordinates: {with_coords}")
    
    client.close()
    print("\nDone! Refresh your browser.")


if __name__ == "__main__":
    asyncio.run(fix())
