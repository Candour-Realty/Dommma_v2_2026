import os
import asyncio
import logging
import resend
import secrets
import base64
from datetime import datetime, timedelta
import uuid as uuid_lib

resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

def generate_verification_token():
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)


def email_footer() -> str:
    """Shared professional footer for all DOMMMA emails"""
    return """
      <div style="background:#1A2F3A;padding:30px;margin-top:0;border-radius:0 0 16px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;">
          <tr>
            <td style="padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
              <p style="margin:0;color:white;font-family:'Georgia',serif;font-size:20px;letter-spacing:2px;">DOMMMA</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">The Operating System for Real Estate</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:16px;"><a href="https://dommma.com" style="color:#C4A962;font-size:12px;text-decoration:none;">Home</a></td>
                  <td style="padding-right:16px;"><a href="https://dommma.com/browse" style="color:#C4A962;font-size:12px;text-decoration:none;">Properties</a></td>
                  <td style="padding-right:16px;"><a href="https://dommma.com/contractors" style="color:#C4A962;font-size:12px;text-decoration:none;">Services</a></td>
                  <td style="padding-right:16px;"><a href="https://dommma.com/privacy" style="color:#C4A962;font-size:12px;text-decoration:none;">Privacy</a></td>
                  <td style="padding-right:16px;"><a href="https://dommma.com/security" style="color:#C4A962;font-size:12px;text-decoration:none;">Security</a></td>
                  <td><a href="https://dommma.com/contact" style="color:#C4A962;font-size:12px;text-decoration:none;">Contact</a></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
              <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;line-height:1.5;">
                DOMMMA Inc. | Vancouver, BC, Canada<br>
                You are receiving this email because you have an account on dommma.com.<br>
                <a href="https://dommma.com/settings" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Manage Preferences</a> |
                <a href="https://dommma.com/settings" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.3);font-size:10px;">
                &copy; 2026 DOMMMA. All rights reserved. Your data is protected under Canadian privacy law (PIPEDA).
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>"""


def email_wrapper_start(subtitle: str = "") -> str:
    """Shared email header wrapper"""
    subtitle_html = f'<p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">{subtitle}</p>' if subtitle else ''
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;font-size:28px;">DOMMMA</h1>
        {subtitle_html}
      </div>
      <div style="background:white;padding:30px;">"""


def email_wrapper_end() -> str:
    """Close the white content area and add footer"""
    return f"""
      </div>
      {email_footer()}"""


def generate_ics_event(title: str, date_str: str, location: str = "", description: str = "", duration_hours: int = 1) -> str:
    """Generate an .ics calendar event string"""
    try:
        # Try to parse the date
        for fmt in ["%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%B %d, %Y", "%Y-%m-%d", "%m/%d/%Y"]:
            try:
                dt = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
        else:
            dt = datetime.now() + timedelta(days=1)
            dt = dt.replace(hour=10, minute=0)

        dt_end = dt + timedelta(hours=duration_hours)
        uid = str(uuid_lib.uuid4())

        ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DOMMMA//dommma.com//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{uid}@dommma.com
DTSTART:{dt.strftime('%Y%m%dT%H%M%S')}
DTEND:{dt_end.strftime('%Y%m%dT%H%M%S')}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location}
STATUS:CONFIRMED
ORGANIZER:mailto:noreply@dommma.com
END:VEVENT
END:VCALENDAR"""
        return ics
    except Exception as e:
        logging.error(f"ICS generation failed: {e}")
        return None


async def send_email(to: str, subject: str, html: str, attachments: list = None):
    """Send email via Resend, optionally with attachments"""
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        if attachments:
            params["attachments"] = attachments
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent to {to}: {subject}")
        return result
    except Exception as e:
        logging.error(f"Email failed to {to}: {e}")
        return None


async def send_email_with_calendar(to: str, subject: str, html: str, event_title: str, event_date: str, event_location: str = "", event_description: str = ""):
    """Send email with .ics calendar attachment"""
    ics_content = generate_ics_event(event_title, event_date, event_location, event_description)
    attachments = None
    if ics_content:
        attachments = [{
            "filename": "event.ics",
            "content": base64.b64encode(ics_content.encode()).decode(),
            "type": "text/calendar"
        }]
    return await send_email(to, subject, html, attachments)


# ============================================================
# EMAIL TEMPLATES
# ============================================================

def email_verification(name: str, verification_link: str) -> str:
    return f"""{email_wrapper_start("Verify Your Email")}
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Welcome, {name}!</h2>
        <p style="color:#555;line-height:1.6;">Thank you for registering with DOMMMA. Please verify your email address to complete your registration.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="{verification_link}" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Verify Email</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        <p style="color:#888;font-size:11px;text-align:center;margin-top:20px;">Or copy this link: {verification_link}</p>
    {email_wrapper_end()}"""


def email_welcome(name: str, role: str) -> str:
    return f"""{email_wrapper_start("Welcome to Your New Home")}
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Welcome, {name}!</h2>
        <p style="color:#555;line-height:1.6;">You've joined DOMMMA as a <strong>{role}</strong>. We're excited to have you!</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="color:#1A2F3A;font-weight:bold;margin:0 0 8px;">Meet Nova, Your AI Assistant</p>
          <p style="color:#555;font-size:14px;margin:0;">Nova can help you find the perfect home, analyze lease documents, calculate commute times, and even match you with contractors. Try the search bar on our homepage!</p>
        </div>
        <p style="color:#555;line-height:1.6;">Get started by exploring properties, connecting with {('landlords' if role=='renter' else 'tenants' if role=='landlord' else 'clients')}, or browsing our contractor marketplace.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/dashboard" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Go to Dashboard</a>
        </div>
    {email_wrapper_end()}"""


def email_booking_confirmed(customer_name: str, contractor_name: str, title: str, date: str) -> str:
    return f"""{email_wrapper_start("Booking Confirmed")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#22c55e;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">&#10003; Booking Confirmed</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {customer_name}!</h2>
        <p style="color:#555;line-height:1.6;">Your booking has been confirmed. Details below:</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Service:</strong> {title}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Contractor:</strong> {contractor_name}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Date:</strong> {date or 'To be confirmed'}</p>
        </div>
        <div style="background:#EFF6FF;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#1E40AF;font-size:14px;">&#128197; <strong>Add to Calendar</strong></p>
          <p style="margin:8px 0 0;color:#1E40AF;font-size:13px;">A calendar invite (.ics file) is attached to this email. Open it to add this appointment to your Google Calendar, Outlook, or Apple Calendar.</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/calendar" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Calendar</a>
        </div>
    {email_wrapper_end()}"""


def email_application_update(name: str, listing_title: str, status: str) -> str:
    status_msg = "approved! Congratulations!" if status == "approved" else f"updated to: {status}"
    status_color = "#22c55e" if status == "approved" else "#F59E0B" if status == "pending" else "#EF4444"
    return f"""{email_wrapper_start("Application Update")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:{status_color};color:white;padding:8px 16px;border-radius:20px;font-size:14px;">{status.title()}</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {name}!</h2>
        <p style="color:#555;line-height:1.6;">Your application for <strong>{listing_title}</strong> has been {status_msg}</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/applications" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Application</a>
        </div>
    {email_wrapper_end()}"""


def email_offer_received(seller_name: str, listing_title: str, offer_amount: int, financing: str, closing_date: str = "") -> str:
    return f"""{email_wrapper_start("New Offer Received")}
        <h2 style="color:#1A2F3A;margin:0 0 16px;">New Offer on {listing_title}</h2>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;font-size:24px;font-weight:bold;">${offer_amount:,}</p>
          <p style="margin:4px 0;color:#555;">Financing: {financing}</p>
          {f'<p style="margin:4px 0;color:#555;">Closing: {closing_date}</p>' if closing_date else ''}
        </div>
        <p style="color:#555;">Hi {seller_name}, log in to review and respond to this offer.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/offers" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Review Offer</a>
        </div>
    {email_wrapper_end()}"""


def email_job_request_confirmation(customer_name: str, service_title: str, location: str, answers: dict = None) -> str:
    """Email sent to customer confirming their job request"""
    answers_html = ""
    if answers:
        answers_list = "".join([f'<li style="color:#555;margin:4px 0;">{k.replace("_", " ").title()}: {v}</li>' for k, v in answers.items() if v])
        answers_html = f'<ul style="list-style:none;padding:0;margin:10px 0;">{answers_list}</ul>'

    return f"""{email_wrapper_start("Your Request is Live")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#22c55e;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">&#10003; Request Posted</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;text-align:center;">Hi {customer_name}!</h2>
        <p style="color:#555;line-height:1.6;text-align:center;">Your request has been posted. Local professionals will contact you with quotes soon.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#1A2F3A;font-weight:bold;font-size:18px;">{service_title}</p>
          <p style="margin:0;color:#888;font-size:14px;">&#128205; {location}</p>
          {answers_html}
        </div>
        <div style="background:#FEF3C7;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#92400E;font-size:14px;">&#128161; <strong>What happens next?</strong></p>
          <p style="margin:8px 0 0;color:#92400E;font-size:13px;">Local professionals will review your request and send you quotes. You can compare their profiles, ratings, and prices before choosing.</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/jobs" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Your Jobs</a>
        </div>
    {email_wrapper_end()}"""


def email_new_lead_notification(contractor_name: str, service_title: str, location: str, description: str, job_id: str) -> str:
    """Email sent to contractors about new job lead matching their specialty"""
    return f"""{email_wrapper_start("New Lead Alert")}
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#3B82F6;color:white;padding:8px 16px;border-radius:20px;font-size:14px;">&#128276; New Job Request</div>
        </div>
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {contractor_name}!</h2>
        <p style="color:#555;line-height:1.6;">A new job matching your expertise has been posted in your area.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#1A2F3A;font-weight:bold;font-size:18px;">{service_title}</p>
          <p style="margin:0 0 12px;color:#888;font-size:14px;">&#128205; {location}</p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">{description[:200]}{'...' if len(description) > 200 else ''}</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/jobs" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View &amp; Submit Quote</a>
        </div>
        <div style="background:#ECFDF5;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#065F46;font-size:14px;">&#128176; <strong>Quick Response Tip</strong></p>
          <p style="margin:8px 0 0;color:#065F46;font-size:13px;">Contractors who respond within the first hour are 3x more likely to be hired. Include a personalized message and competitive quote!</p>
        </div>
    {email_wrapper_end()}"""


def email_bid_received(customer_name: str, contractor_name: str, bid_amount: float, job_title: str, message: str) -> str:
    """Email sent to customer when a contractor submits a bid"""
    return f"""{email_wrapper_start("New Quote Received")}
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {customer_name}!</h2>
        <p style="color:#555;line-height:1.6;">Great news! A professional has submitted a quote for your job.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 4px;color:#888;font-size:12px;">QUOTE FOR</p>
          <p style="margin:0 0 16px;color:#1A2F3A;font-weight:bold;">{job_title}</p>
          <div style="border-top:1px solid #E5E5E5;padding-top:16px;">
            <table width="100%"><tr>
              <td><p style="margin:0;color:#1A2F3A;font-weight:bold;font-size:16px;">{contractor_name}</p></td>
              <td style="text-align:right;"><p style="margin:0;color:#1A2F3A;font-weight:bold;font-size:24px;">${bid_amount:,.2f}</p></td>
            </tr></table>
          </div>
          <div style="background:white;border-radius:8px;padding:12px;margin-top:12px;">
            <p style="margin:0;color:#555;font-size:14px;font-style:italic;">"{message[:150]}{'...' if len(message) > 150 else ''}"</p>
          </div>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://dommma.com/jobs" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View All Quotes</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center;">Compare quotes from multiple professionals before making your decision.</p>
    {email_wrapper_end()}"""
