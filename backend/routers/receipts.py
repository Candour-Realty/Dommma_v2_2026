"""Payment receipt PDF generation and payment history"""
import os
import io
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

router = APIRouter(tags=["receipts"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


@router.get("/payments/history")
async def get_payment_history(user_id: str, role: str = "tenant", limit: int = 50):
    """Get payment history for a user"""
    query = {"tenant_id": user_id} if role == "tenant" else {"landlord_id": user_id}
    payments = await db.rent_payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    for p in payments:
        if p.get("agreement_id"):
            agreement = await db.rent_agreements.find_one({"id": p["agreement_id"]}, {"_id": 0})
            if agreement:
                listing = await db.listings.find_one({"id": agreement.get("property_id", "")}, {"_id": 0, "title": 1, "address": 1})
                p["property_title"] = listing.get("title", "Property") if listing else "Property"
                p["property_address"] = listing.get("address", "") if listing else ""
    
    return payments


@router.get("/payments/{payment_id}/receipt")
async def generate_receipt_pdf(payment_id: str):
    """Generate a PDF receipt for a payment"""
    payment = await db.rent_payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.get("status") not in ["paid", "completed"]:
        raise HTTPException(status_code=400, detail="Receipt only available for completed payments")
    
    tenant = await db.users.find_one({"id": payment.get("tenant_id")}, {"_id": 0, "name": 1, "email": 1})
    landlord = await db.users.find_one({"id": payment.get("landlord_id")}, {"_id": 0, "name": 1, "email": 1})
    
    property_info = None
    if payment.get("agreement_id"):
        agreement = await db.rent_agreements.find_one({"id": payment["agreement_id"]}, {"_id": 0})
        if agreement and agreement.get("property_id"):
            property_info = await db.listings.find_one({"id": agreement["property_id"]}, {"_id": 0, "title": 1, "address": 1})
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, textColor=colors.HexColor('#1A2F3A'), spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, textColor=colors.grey)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1A2F3A'), spaceBefore=12)
    normal_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=16)
    
    elements = []
    elements.append(Paragraph("DOMMMA", title_style))
    elements.append(Paragraph("Rent Payment Receipt", subtitle_style))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", color=colors.HexColor('#1A2F3A'), thickness=2))
    elements.append(Spacer(1, 20))
    
    receipt_data = [
        ["Receipt Number:", payment["id"][:8].upper()],
        ["Date:", datetime.fromisoformat(payment.get("paid_at", payment.get("created_at", ""))).strftime("%B %d, %Y") if payment.get("paid_at") or payment.get("created_at") else "N/A"],
        ["Status:", "PAID"],
    ]
    
    for label, value in receipt_data:
        elements.append(Paragraph(f"<b>{label}</b> {value}", normal_style))
    
    elements.append(Spacer(1, 16))
    elements.append(Paragraph("Tenant", heading_style))
    elements.append(Paragraph(f"{tenant.get('name', 'N/A')} ({tenant.get('email', '')})", normal_style))
    
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Landlord", heading_style))
    elements.append(Paragraph(f"{landlord.get('name', 'N/A')} ({landlord.get('email', '')})", normal_style))
    
    if property_info:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("Property", heading_style))
        elements.append(Paragraph(f"{property_info.get('title', '')} - {property_info.get('address', '')}", normal_style))
    
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Payment Details", heading_style))
    elements.append(Spacer(1, 8))
    
    table_data = [
        ["Description", "Amount"],
        ["Monthly Rent", f"${payment.get('amount', 0):,.2f}"],
    ]
    if payment.get("late_fee", 0) > 0:
        table_data.append(["Late Fee", f"${payment['late_fee']:,.2f}"])
    if payment.get("platform_fee", 0) > 0:
        table_data.append(["Platform Fee", f"${payment['platform_fee']:,.2f}"])
    
    total = payment.get("total_due") or payment.get("amount", 0)
    table_data.append(["Total Paid", f"${total:,.2f}"])
    
    table = Table(table_data, colWidths=[4*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A2F3A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f4f5')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(table)
    
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", color=colors.lightgrey, thickness=1))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("This receipt was generated by DOMMMA. For questions, contact support@dommma.com", 
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.grey, alignment=1)))
    
    if payment.get("stripe_payment_intent_id"):
        elements.append(Paragraph(f"Stripe Reference: {payment['stripe_payment_intent_id']}", 
                                  ParagraphStyle('Ref', parent=styles['Normal'], fontSize=8, textColor=colors.lightgrey, alignment=1)))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=DOMMMA_Receipt_{payment['id'][:8].upper()}.pdf"}
    )
