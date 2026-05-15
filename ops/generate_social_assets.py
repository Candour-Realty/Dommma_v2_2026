"""
Generate Facebook/social-media assets from the real Dommma logo.

Input:  C:/Users/risha/Dommma/Logo/Logo_v1.png  (1359x620 RGBA — D-mark + wordmark)
Output: frontend/public/social/
  - dommma-logo-v1.png      — verbatim copy of the master, transparent bg
  - fb-profile-1024.png     — square 1024x1024, D-mark only, white bg (FB profile pic)
  - fb-profile-1024-navy.png — same but navy bg (alt option, if you prefer dark)
  - fb-cover-1640.png       — 1640x624 cover with full logo centered on navy
  - social-square-1080.png  — 1080x1080 with full logo centered on white (Instagram, square posts)
  - linkedin-banner-1584.png — 1584x396 LinkedIn-spec banner

Brand colors sampled from logo:
  NAVY  = #144670  (was #0F1419 on the site — DIFFERENT, FYI)
  GOLD  = #F5C520  (was #C4A962 on the site — DIFFERENT, FYI)
"""
from pathlib import Path
from PIL import Image

SOURCE = Path("C:/Users/risha/Dommma/Logo/Logo_v1.png")
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "frontend" / "public" / "social"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Colors sampled from the actual logo
NAVY = (20, 70, 112)        # #144670
GOLD = (245, 197, 32)       # #F5C520 (approx — building element)
WHITE = (255, 255, 255)
CREAM = (248, 245, 238)

# Layout regions inside the source logo (discovered via alpha scan)
D_MARK_TOP = 0
D_MARK_BOTTOM = 350
GAP_END = 420
WORDMARK_BOTTOM = 620


def _tight_crop(img: Image.Image) -> Image.Image:
    """Crop transparent margins to tight bbox."""
    bbox = img.split()[-1].getbbox()
    return img.crop(bbox) if bbox else img


def _crop_d_mark(source: Image.Image) -> Image.Image:
    """Return just the D-mark portion of the logo, tightly cropped."""
    return _tight_crop(source.crop((0, D_MARK_TOP, source.width, D_MARK_BOTTOM)))


def _crop_full(source: Image.Image) -> Image.Image:
    """Return the full logo (D-mark + wordmark), tightly cropped."""
    return _tight_crop(source)


def _paste_centered(canvas: Image.Image, fg: Image.Image, scale: float = 0.7) -> Image.Image:
    """Paste fg centered on canvas, scaled to `scale` of the smaller canvas dim."""
    cw, ch = canvas.size
    target_h = int(min(cw, ch) * scale)
    ratio = target_h / fg.height
    new_w = int(fg.width * ratio)
    new_h = target_h
    if new_w > cw * 0.92:
        new_w = int(cw * 0.92)
        new_h = int(fg.height * new_w / fg.width)
    fg_resized = fg.resize((new_w, new_h), Image.LANCZOS)
    x = (cw - new_w) // 2
    y = (ch - new_h) // 2
    canvas.paste(fg_resized, (x, y), fg_resized)
    return canvas


def main():
    print(f"Source: {SOURCE}")
    print(f"Output: {OUTPUT_DIR}")

    source = Image.open(SOURCE).convert("RGBA")

    # 0) Verbatim copy of the master
    master_out = OUTPUT_DIR / "dommma-logo-v1.png"
    source.save(master_out)
    print(f"  [ok] {master_out.name}")

    d_mark = _crop_d_mark(source)
    full_logo = _crop_full(source)

    # 1) FB profile pic — white bg, D-mark only, 1024 square (readable in tiny circle crop)
    canvas = Image.new("RGB", (1024, 1024), WHITE)
    _paste_centered(canvas.convert("RGBA"), d_mark, scale=0.72).convert("RGB").save(
        OUTPUT_DIR / "fb-profile-1024.png", optimize=True
    )
    print(f"  [ok] fb-profile-1024.png  (D-mark on white, circle-friendly)")

    # 2) FB profile pic alt — navy bg version (if you prefer dark)
    canvas = Image.new("RGB", (1024, 1024), NAVY)
    # On navy the navy D outline disappears — replace with white D-mark by inverting
    # the logo so the building stays gold, the D becomes white. Skip the recolor
    # complexity; just use a slight white card behind the mark instead.
    card = Image.new("RGBA", (820, 820), (255, 255, 255, 255))
    cx = (1024 - 820) // 2
    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba.paste(card, (cx, cx), card)
    _paste_centered(canvas_rgba, d_mark, scale=0.58).convert("RGB").save(
        OUTPUT_DIR / "fb-profile-1024-navy.png", optimize=True
    )
    print(f"  [ok] fb-profile-1024-navy.png  (D-mark on white card on navy)")

    # 3) FB cover — 1640x624 navy bg, full logo centered
    canvas = Image.new("RGB", (1640, 624), NAVY)
    canvas_rgba = canvas.convert("RGBA")
    # Put logo on a subtle white card so the navy D-outline shows
    card_w, card_h = 1100, 460
    card = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
    canvas_rgba.paste(card, ((1640 - card_w) // 2, (624 - card_h) // 2), card)
    _paste_centered(canvas_rgba, full_logo, scale=0.62).convert("RGB").save(
        OUTPUT_DIR / "fb-cover-1640.png", optimize=True
    )
    print(f"  [ok] fb-cover-1640.png  (full logo on white card on navy)")

    # 4) Instagram / square 1080
    canvas = Image.new("RGB", (1080, 1080), WHITE)
    _paste_centered(canvas.convert("RGBA"), full_logo, scale=0.72).convert("RGB").save(
        OUTPUT_DIR / "social-square-1080.png", optimize=True
    )
    print(f"  [ok] social-square-1080.png  (Instagram, square posts)")

    # 5) LinkedIn banner 1584x396
    canvas = Image.new("RGB", (1584, 396), NAVY)
    canvas_rgba = canvas.convert("RGBA")
    card_w, card_h = 900, 290
    card = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
    canvas_rgba.paste(card, ((1584 - card_w) // 2, (396 - card_h) // 2), card)
    _paste_centered(canvas_rgba, full_logo, scale=0.62).convert("RGB").save(
        OUTPUT_DIR / "linkedin-banner-1584.png", optimize=True
    )
    print(f"  [ok] linkedin-banner-1584.png")

    print("\nDone.")


if __name__ == "__main__":
    main()
