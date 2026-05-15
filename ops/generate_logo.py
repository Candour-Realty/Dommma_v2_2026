"""
Generate Dommma logo files.

Outputs (saved to frontend/public/):
  - logo512.png       — 512x512 monogram D on navy, gold accent (FB profile pic, manifest)
  - logo192.png       — 192x192 same (manifest)
  - logo1024.png      — 1024x1024 high-res (FB upload)
  - logo-wordmark.png — 1600x500 wordmark for cover/header
  - fb-cover.png      — 1640x624 Facebook cover photo with tagline
  - favicon.png       — 64x64 monogram

Brand: Cormorant Garamond if downloadable, fallback to Cambria.
Colors: navy #0F1419 base, gold #C4A962 mark, cream #F8F5EE accent.
"""
import io
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

import urllib.request

# Brand tokens (match _shared-dark.css)
NAVY = (15, 20, 25)       # #0F1419
CARD = (26, 35, 50)       # #1A2332
GOLD = (196, 169, 98)     # #C4A962
GOLD_SOFT = (212, 187, 114)  # #D4BB72
CREAM = (248, 245, 238)   # #F8F5EE
CREAM_MUTED = (180, 175, 165)
LINE = (42, 52, 65)       # #2A3441

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "frontend" / "public"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_CACHE = Path(__file__).resolve().parent / "fonts"
FONT_CACHE.mkdir(exist_ok=True)


_CORMORANT_URLS = [
    # Variable font on the official Google Fonts repo
    "https://github.com/google/fonts/raw/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    # jsdelivr CDN mirror
    "https://cdn.jsdelivr.net/gh/google/fonts/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
]
_CORMORANT_ITALIC_URLS = [
    "https://github.com/google/fonts/raw/main/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf",
    "https://cdn.jsdelivr.net/gh/google/fonts/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf",
]


def _try_download(urls: list[str], target: Path) -> str | None:
    if target.exists():
        return str(target)
    for url in urls:
        try:
            urllib.request.urlretrieve(url, target)
            print(f"  downloaded font: {target.name}")
            return str(target)
        except Exception as e:
            print(f"  font URL failed ({url[:60]}): {e!s}")
            continue
    return None


def _font(size: int, italic: bool = False) -> ImageFont.FreeTypeFont:
    if italic:
        path = _try_download(_CORMORANT_ITALIC_URLS, FONT_CACHE / "CormorantGaramond-Italic.ttf")
        fallback = "C:/Windows/Fonts/georgiai.ttf"
    else:
        path = _try_download(_CORMORANT_URLS, FONT_CACHE / "CormorantGaramond.ttf")
        fallback = "C:/Windows/Fonts/georgia.ttf"
    try:
        return ImageFont.truetype(path or fallback, size=size)
    except Exception as e:
        print(f"  font load failed ({e}); using PIL default")
        return ImageFont.load_default(size=size)


def _measure(draw: ImageDraw.ImageDraw, text: str, font) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


# ---------- Monogram (D on navy with gold accent) ----------

def make_monogram(size: int) -> Image.Image:
    """Square logo with serif D in gold on navy, surrounded by a subtle frame."""
    img = Image.new("RGB", (size, size), NAVY)
    draw = ImageDraw.Draw(img)

    # Subtle hairline border (luxury feel)
    padding = max(int(size * 0.045), 8)
    border_w = max(int(size * 0.004), 1)
    draw.rectangle(
        [padding, padding, size - padding - 1, size - padding - 1],
        outline=LINE,
        width=border_w,
    )
    # Inner gold corner accents (4 little corner ticks like a real estate sign)
    tick_len = int(size * 0.05)
    tick_inset = padding + int(size * 0.025)
    tick_w = max(int(size * 0.007), 2)
    for (x, y, dx, dy) in [
        (tick_inset, tick_inset, 1, 0),   # top-left horizontal
        (tick_inset, tick_inset, 0, 1),   # top-left vertical
        (size - tick_inset, tick_inset, -1, 0),  # top-right horizontal
        (size - tick_inset, tick_inset, 0, 1),   # top-right vertical
        (tick_inset, size - tick_inset, 1, 0),   # bottom-left horizontal
        (tick_inset, size - tick_inset, 0, -1),  # bottom-left vertical
        (size - tick_inset, size - tick_inset, -1, 0),  # bottom-right horizontal
        (size - tick_inset, size - tick_inset, 0, -1),  # bottom-right vertical
    ]:
        draw.line(
            [(x, y), (x + dx * tick_len, y + dy * tick_len)],
            fill=GOLD, width=tick_w,
        )

    # The "D" — large serif in gold
    d_font = _font(int(size * 0.60))
    text = "D"
    w, h = _measure(draw, text, d_font)
    # textbbox baseline offset — center optically
    cx = (size - w) // 2
    bbox = draw.textbbox((0, 0), text, font=d_font)
    cy = (size - h) // 2 - bbox[1]
    draw.text((cx, cy), text, font=d_font, fill=GOLD)

    # Tiny wordmark underneath "DOMMMA" in cream, only if size permits
    if size >= 256:
        wm_font = _font(int(size * 0.075))
        wm_text = "D O M M M A"
        ww, _ = _measure(draw, wm_text, wm_font)
        wm_y = int(size * 0.82)
        draw.text(((size - ww) // 2, wm_y), wm_text, font=wm_font, fill=CREAM_MUTED)

    return img


# ---------- Wordmark (horizontal "DOMMMA") ----------

def make_wordmark(width: int = 1600, height: int = 500) -> Image.Image:
    img = Image.new("RGB", (width, height), NAVY)
    draw = ImageDraw.Draw(img)

    # Wordmark text — letter-spaced
    letters = "DOMMMA"
    font = _font(int(height * 0.40))

    # Manually space letters for tracking
    spacing = int(height * 0.06)
    glyph_widths = []
    for ch in letters:
        w, _ = _measure(draw, ch, font)
        glyph_widths.append(w)
    total_w = sum(glyph_widths) + spacing * (len(letters) - 1)

    bbox = draw.textbbox((0, 0), letters[0], font=font)
    glyph_h = bbox[3] - bbox[1]
    y = (height - glyph_h) // 2 - bbox[1]

    x = (width - total_w) // 2
    for i, ch in enumerate(letters):
        draw.text((x, y), ch, font=font, fill=CREAM)
        x += glyph_widths[i] + spacing

    # Gold hairline under the wordmark
    line_y = int(height * 0.78)
    line_w = int(width * 0.12)
    line_x = (width - line_w) // 2
    draw.line(
        [(line_x, line_y), (line_x + line_w, line_y)],
        fill=GOLD, width=max(2, height // 200),
    )

    return img


# ---------- FB Cover (1640x624 with tagline) ----------

def make_fb_cover() -> Image.Image:
    w, h = 1640, 624
    img = Image.new("RGB", (w, h), NAVY)
    draw = ImageDraw.Draw(img)

    # Subtle gradient/glow effect: ambient gold blob top-right
    glow = Image.new("RGB", (w, h), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    for r in range(700, 100, -20):
        alpha = int(20 * (1 - r / 700))
        glow_draw.ellipse(
            [w - r - 100, -r // 2, w - 100 + r, h // 2 + r],
            fill=(NAVY[0] + alpha // 3, NAVY[1] + alpha // 3, NAVY[2] + alpha // 2),
        )
    img = Image.blend(img, glow, 0.5)
    draw = ImageDraw.Draw(img)

    # Wordmark (large)
    font_lg = _font(220)
    wordmark = "DOMMMA"
    wm_w, wm_h = _measure(draw, wordmark, font_lg)
    bbox = draw.textbbox((0, 0), wordmark, font=font_lg)
    wm_y = 130
    draw.text(((w - wm_w) // 2, wm_y - bbox[1]), wordmark, font=font_lg, fill=CREAM)

    # Tagline (italic, gold underline)
    tag_font = _font(54, italic=True)
    tagline = "Vancouver's real estate marketplace."
    tag_w, _ = _measure(draw, tagline, tag_font)
    tag_y = wm_y + wm_h + 60
    draw.text(((w - tag_w) // 2, tag_y), tagline, font=tag_font, fill=GOLD)

    # Bottom row — service line
    services_font = _font(28)
    services = "Rentals  ·  Buy & Sell  ·  Lease Takeover  ·  Verified Pros"
    sw, _ = _measure(draw, services, services_font)
    draw.text(((w - sw) // 2, h - 100), services, font=services_font, fill=CREAM_MUTED)

    # URL bottom-right
    url_font = _font(26)
    url = "dommma.com"
    uw, _ = _measure(draw, url, url_font)
    draw.text((w - uw - 60, h - 60), url, font=url_font, fill=GOLD)

    return img


# ---------- Run ----------

def main():
    print(f"Output: {OUTPUT_DIR}")

    # Monogram suite
    for size, name in [(64, "favicon.png"), (192, "logo192.png"), (512, "logo512.png"), (1024, "logo1024.png")]:
        img = make_monogram(size)
        path = OUTPUT_DIR / name
        img.save(path, "PNG", optimize=True)
        print(f"  [ok]{path} ({size}x{size})")

    # Wordmark
    wm = make_wordmark()
    wm_path = OUTPUT_DIR / "logo-wordmark.png"
    wm.save(wm_path, "PNG", optimize=True)
    print(f"  [ok]{wm_path} (1600x500)")

    # FB cover
    cover = make_fb_cover()
    cover_path = OUTPUT_DIR / "fb-cover.png"
    cover.save(cover_path, "PNG", optimize=True)
    print(f"  [ok]{cover_path} (1640x624)")

    print("\nDone. Logos saved to frontend/public/")


if __name__ == "__main__":
    main()
