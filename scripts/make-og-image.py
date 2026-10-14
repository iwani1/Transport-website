#!/usr/bin/env python3
"""
Builds the social-share image (src/img/og-image.jpg, 1200x630) in the site's
design: dark teal background, the hero photo faded in on the right, the logo
on a white card, the headline in Bebas Neue and the service list in Inter.

    python3 scripts/make-og-image.py

Requires Pillow and fontTools (pip install Pillow fonttools brotli); the fonts
are converted from the site's own woff2 files, so nothing else is needed.
"""
import io
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("pip install Pillow fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
W, H = 1200, 630
INK, INK2, TEAL, TEAL2, ORANGE, CREAM = (7, 20, 26), (12, 31, 39), (31, 111, 111), (47, 179, 166), (242, 107, 33), (244, 241, 234)


def font(woff2, size):
    """Load one of the site's woff2 fonts into Pillow (which needs TTF/OTF)."""
    f = TTFont(SRC / "fonts" / woff2)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def main():
    img = Image.new("RGB", (W, H), INK)
    # Soft teal glow top-left, subtle gradient to the right
    glow = Image.new("RGB", (W, H), INK)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-300, -250, 700, 550), fill=(18, 60, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.blend(img, glow, 0.9)

    # Photo on the right, faded into the background
    photo = Image.open(SRC / "img" / "hero" / "truck-dusk.webp").convert("RGB")
    ph = H
    pw = int(photo.width * ph / photo.height)
    photo = photo.resize((pw, ph), Image.LANCZOS)
    photo = photo.crop((pw - 760, 0, pw, ph))  # right-hand part: the truck
    mask = Image.linear_gradient("L").rotate(90, expand=True).resize((760, H))  # transparent on the left, opaque right
    mask = mask.point(lambda v: int(min(255, max(0, (v - 40) * 1.3)) * 0.75))
    img.paste(photo, (W - 760, 0), mask)
    # Darken the bottom so the text stays readable
    shade = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        sd.line((0, y, W, y), fill=int(140 * (y / H) ** 2))
    img.paste(Image.new("RGB", (W, H), INK), (0, 0), shade)

    d = ImageDraw.Draw(img)
    # Orange accent bar
    d.rectangle((0, 0, 14, H), fill=ORANGE)

    # Logo on a white card
    logo = Image.open(SRC / "img" / "logo.png").convert("RGBA")
    lh = 92
    lw = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    card = Image.new("RGBA", (lw + 36, lh + 24), (255, 255, 255, 255))
    rounded = Image.new("L", card.size, 0)
    ImageDraw.Draw(rounded).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=18, fill=255)
    card.paste(logo, (18, 12), logo)
    img.paste(card, (64, 56), rounded)

    # Headline
    bebas = font("bebas-neue-latin-400-normal.woff2", 128)
    d.text((60, 196), "WE MOVE FREIGHT", font=bebas, fill=CREAM)
    d.text((60, 312), "ACROSS GHANA.", font=bebas, fill=TEAL2)

    # Service line + place
    inter6 = font("inter-latin-600-normal.woff2", 26)
    inter5 = font("inter-latin-500-normal.woff2", 22)
    d.text((64, 466), "Freight forwarding  ·  Customs clearing  ·  Trucking  ·  Warehousing", font=inter6, fill=(233, 238, 240))
    d.text((64, 506), "Tema Port, Ghana  ·  (+233) 24 683 5764", font=inter5, fill=(159, 179, 184))

    # URL pill bottom-left
    pill_text = "blaharbenyah.com"
    tw = d.textlength(pill_text, font=inter6)
    d.rounded_rectangle((64, 556, 64 + tw + 44, 556 + 46), radius=23, fill=ORANGE)
    d.text((86, 565), pill_text, font=inter6, fill=INK)

    out = SRC / "img" / "og-image.jpg"
    img.save(out, quality=86, optimize=True, progressive=True)
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
