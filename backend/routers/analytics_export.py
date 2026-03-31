"""Analytics export router - CSV and PDF report generation"""
import io
import csv
import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics-export"])


@router.get("/export/csv/{user_id}")
async def export_analytics_csv(user_id: str, report_type: str = "payments", period: str = "30d"):
    """Export analytics data as CSV"""
    days = int(period.replace("d", "")) if period.endswith("d") else 30
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    if report_type == "payments":
        data = await db.payment_transactions.find(
            {"$or": [{"user_id": user_id}, {"recipient_id": user_id}], "created_at": {"$gte": since}},
            {"_id": 0, "id": 1, "amount": 1, "currency": 1, "description": 1, "payment_status": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(1000)
        headers = ["ID", "Amount", "Currency", "Description", "Status", "Date"]
        rows = [[d.get("id",""), d.get("amount",""), d.get("currency","CAD"), d.get("description",""), d.get("payment_status",""), d.get("created_at","")] for d in data]

    elif report_type == "listings":
        data = await db.listings.find(
            {"$or": [{"owner_id": user_id}, {"landlord_id": user_id}, {"user_id": user_id}]},
            {"_id": 0, "id": 1, "title": 1, "address": 1, "city": 1, "price": 1, "bedrooms": 1, "bathrooms": 1, "status": 1, "listing_type": 1, "created_at": 1}
        ).to_list(500)
        headers = ["ID", "Title", "Address", "City", "Price", "Beds", "Baths", "Status", "Type", "Created"]
        rows = [[d.get("id",""), d.get("title",""), d.get("address",""), d.get("city",""), d.get("price",""), d.get("bedrooms",""), d.get("bathrooms",""), d.get("status",""), d.get("listing_type",""), d.get("created_at","")] for d in data]

    elif report_type == "bookings":
        data = await db.bookings.find(
            {"$or": [{"customer_id": user_id}, {"contractor_id": user_id}]},
            {"_id": 0, "id": 1, "title": 1, "status": 1, "amount": 1, "preferred_date": 1, "rating": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(500)
        headers = ["ID", "Title", "Status", "Amount", "Preferred Date", "Rating", "Created"]
        rows = [[d.get("id",""), d.get("title",""), d.get("status",""), d.get("amount",""), d.get("preferred_date",""), d.get("rating",""), d.get("created_at","")] for d in data]

    elif report_type == "rent_agreements":
        data = await db.rent_agreements.find(
            {"$or": [{"landlord_id": user_id}, {"tenant_id": user_id}]},
            {"_id": 0, "id": 1, "property_address": 1, "monthly_rent": 1, "start_date": 1, "end_date": 1, "status": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(500)
        headers = ["ID", "Property", "Monthly Rent", "Start Date", "End Date", "Status", "Created"]
        rows = [[d.get("id",""), d.get("property_address",""), d.get("monthly_rent",""), d.get("start_date",""), d.get("end_date",""), d.get("status",""), d.get("created_at","")] for d in data]

    elif report_type == "overview":
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "user_type": 1})
        user_type = user.get("user_type", "renter") if user else "renter"

        listings_count = await db.listings.count_documents({"$or": [{"owner_id": user_id}, {"landlord_id": user_id}]})
        payments_count = await db.payment_transactions.count_documents({"$or": [{"user_id": user_id}, {"recipient_id": user_id}]})
        bookings_count = await db.bookings.count_documents({"$or": [{"customer_id": user_id}, {"contractor_id": user_id}]})
        agreements_count = await db.rent_agreements.count_documents({"$or": [{"landlord_id": user_id}, {"tenant_id": user_id}]})

        headers = ["Metric", "Value"]
        rows = [
            ["User Type", user_type],
            ["Total Listings", listings_count],
            ["Total Payments", payments_count],
            ["Total Bookings", bookings_count],
            ["Total Agreements", agreements_count],
            ["Report Generated", datetime.now(timezone.utc).isoformat()],
            ["Period", f"Last {days} days"]
        ]
        data = rows
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)

    filename = f"dommma_{report_type}_report_{datetime.now().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/json/{user_id}")
async def export_analytics_json(user_id: str, report_type: str = "overview", period: str = "30d"):
    """Export analytics data as JSON report"""
    days = int(period.replace("d", "")) if period.endswith("d") else 30
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1, "user_type": 1})

    report = {
        "report_type": report_type,
        "user": user or {},
        "period_days": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data": {}
    }

    listings_count = await db.listings.count_documents({"$or": [{"owner_id": user_id}, {"landlord_id": user_id}]})
    payments = await db.payment_transactions.find(
        {"$or": [{"user_id": user_id}, {"recipient_id": user_id}], "created_at": {"$gte": since}},
        {"_id": 0, "amount": 1, "payment_status": 1}
    ).to_list(1000)

    total_revenue = sum(p.get("amount", 0) for p in payments if p.get("payment_status") == "completed")
    bookings_count = await db.bookings.count_documents({"$or": [{"customer_id": user_id}, {"contractor_id": user_id}]})

    report["data"] = {
        "total_listings": listings_count,
        "total_payments": len(payments),
        "total_revenue": total_revenue,
        "total_bookings": bookings_count,
        "payment_breakdown": {
            "completed": len([p for p in payments if p.get("payment_status") == "completed"]),
            "pending": len([p for p in payments if p.get("payment_status") == "pending"]),
            "failed": len([p for p in payments if p.get("payment_status") == "failed"])
        }
    }

    return report
