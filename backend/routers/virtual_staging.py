"""Virtual Staging AI router - Generate staged room images using AI"""
import os
import base64
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/virtual-staging", tags=["virtual-staging"])


@router.post("/stage")
async def stage_room(
    file: UploadFile = File(...),
    room_type: str = Form("living_room"),
    style: str = Form("modern"),
    listing_id: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """Generate a virtually staged version of an empty room photo using AI"""
    from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI image generation not configured")

    file_content = await file.read()
    file_base64 = base64.b64encode(file_content).decode('utf-8')

    room_descriptions = {
        "living_room": "a stylish living room with a modern sofa, coffee table, area rug, floor lamp, and decorative plants",
        "bedroom": "a cozy bedroom with a queen bed, nightstands, soft bedding, curtains, and warm lighting",
        "kitchen": "a modern kitchen with stainless steel appliances, counter accessories, pendant lights, and a small dining set",
        "dining_room": "an elegant dining room with a dining table for six, chairs, chandelier, and table settings",
        "office": "a professional home office with a desk, ergonomic chair, bookshelves, and a desk lamp",
        "bathroom": "a spa-like bathroom with fresh towels, bath mat, candles, and decorative accessories"
    }

    style_descriptions = {
        "modern": "clean lines, minimalist Scandinavian-inspired modern design",
        "traditional": "warm and classic traditional design with rich wood tones",
        "contemporary": "sleek contemporary design with bold accents and neutral tones",
        "industrial": "urban industrial design with exposed elements and raw materials",
        "coastal": "light and airy coastal design with blue accents and natural textures",
        "luxury": "high-end luxury design with premium materials and elegant furnishings"
    }

    room_desc = room_descriptions.get(room_type, room_descriptions["living_room"])
    style_desc = style_descriptions.get(style, style_descriptions["modern"])

    prompt = (
        f"Transform this empty room photo into {room_desc}. "
        f"Use {style_desc}. "
        f"Keep the room's architecture, windows, and structure exactly as shown. "
        f"Add realistic furniture, decor, and lighting that match the space proportions. "
        f"Professional real estate photography quality, well-lit, inviting atmosphere."
    )

    try:
        image_gen = OpenAIImageGeneration(api_key=api_key)
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )

        if not images or len(images) == 0:
            raise HTTPException(status_code=500, detail="No image was generated")

        image_base64 = base64.b64encode(images[0]).decode('utf-8')

        import uuid
        staging_id = str(uuid.uuid4())
        staging_doc = {
            "id": staging_id,
            "listing_id": listing_id,
            "user_id": user_id,
            "room_type": room_type,
            "style": style,
            "prompt": prompt,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.virtual_stagings.insert_one(staging_doc)

        return {
            "success": True,
            "staging_id": staging_id,
            "image_base64": image_base64,
            "room_type": room_type,
            "style": style,
            "message": f"Room virtually staged with {style} {room_type} design"
        }

    except Exception as e:
        logger.error(f"Virtual staging error: {e}")
        raise HTTPException(status_code=500, detail=f"Virtual staging failed: {str(e)}")


@router.get("/history/{user_id}")
async def get_staging_history(user_id: str, limit: int = 20):
    """Get virtual staging history for a user"""
    stagings = await db.virtual_stagings.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return stagings


@router.get("/styles")
async def get_staging_styles():
    """Get available staging styles and room types"""
    return {
        "room_types": [
            {"id": "living_room", "label": "Living Room"},
            {"id": "bedroom", "label": "Bedroom"},
            {"id": "kitchen", "label": "Kitchen"},
            {"id": "dining_room", "label": "Dining Room"},
            {"id": "office", "label": "Home Office"},
            {"id": "bathroom", "label": "Bathroom"}
        ],
        "styles": [
            {"id": "modern", "label": "Modern / Scandinavian"},
            {"id": "traditional", "label": "Traditional / Classic"},
            {"id": "contemporary", "label": "Contemporary"},
            {"id": "industrial", "label": "Industrial / Urban"},
            {"id": "coastal", "label": "Coastal / Beach"},
            {"id": "luxury", "label": "Luxury / Premium"}
        ]
    }
