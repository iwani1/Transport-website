#!/usr/bin/env python3
"""
Image optimisation helper for the Blahar & Benyah website.

Two ways to use it:

1. Optimise ONE new photo before adding it to the site:

       python3 scripts/optimize-images.py photo.jpg src/img/content/my-photo.webp --width 1200

   The output format is taken from the output file extension (.webp, .jpg, .png).

2. Re-run the full pipeline from the original site export (what was used to
   build the current `src/img/` folder):

       python3 scripts/optimize-images.py --from-export /path/to/blaharbenyah.com

Requires Pillow:  pip install Pillow
"""
import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "img"


def optimise(src, dst, width=None, height=None, quality=78, lossless=False):
    """Resize (never upscale) and re-encode `src` into `dst`."""
    src, dst = Path(src), Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)

    if width or height:
        w, h = im.size
        scale = min(
            (width / w) if width else 1.0,
            (height / h) if height else 1.0,
            1.0,  # never upscale
        )
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    ext = dst.suffix.lower()
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    if ext == ".webp":
        im.save(dst, "WEBP", quality=quality, method=6, lossless=lossless)
    elif ext in (".jpg", ".jpeg"):
        if has_alpha:
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.convert("RGBA").split()[-1])
            im = bg
        im.convert("RGB").save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    elif ext == ".png":
        if not has_alpha:
            im = im.convert("RGB")
        im.save(dst, "PNG", optimize=True)
    else:
        raise SystemExit(f"Unsupported output extension: {ext}")

    before = src.stat().st_size
    after = dst.stat().st_size
    print(f"{src.name:40s} -> {str(dst.relative_to(ROOT)) if dst.is_relative_to(ROOT) else dst:50s} "
          f"{im.size[0]}x{im.size[1]}  {before/1024:7.0f} KB -> {after/1024:6.0f} KB")


def make_favicons(logo_path, out_dir):
    """Crop the peacock mark out of the wordmark logo and write favicon files."""
    im = Image.open(logo_path).convert("RGBA")
    w, h = im.size
    mark = im.crop((0, 0, int(w * 0.265), h))  # peacock + truck mark on the left
    # make it square on a white background
    side = max(mark.size)
    square = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    square.paste(mark, ((side - mark.size[0]) // 2, (side - mark.size[1]) // 2), mark)

    out_dir.mkdir(parents=True, exist_ok=True)
    square.resize((180, 180), Image.LANCZOS).convert("RGB").save(out_dir / "apple-touch-icon.png", optimize=True)
    square.resize((32, 32), Image.LANCZOS).convert("RGB").save(out_dir / "favicon-32x32.png", optimize=True)
    square.resize((192, 192), Image.LANCZOS).convert("RGB").save(out_dir / "android-chrome-192x192.png", optimize=True)
    square.convert("RGB").save(out_dir / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicons written to", out_dir)


def make_og_image(logo_path, dst):
    """1200x630 social sharing card: logo centred on white with a brand bar."""
    card = Image.new("RGB", (1200, 630), (255, 255, 255))
    logo = Image.open(logo_path).convert("RGB")
    logo.thumbnail((980, 300), Image.LANCZOS)
    card.paste(logo, ((1200 - logo.size[0]) // 2, (630 - logo.size[1]) // 2 - 20))
    bar = Image.new("RGB", (1200, 26), (11, 96, 169))  # brand blue #0B60A9
    card.paste(bar, (0, 604))
    dst.parent.mkdir(parents=True, exist_ok=True)
    card.save(dst, "JPEG", quality=85, optimize=True, progressive=True)
    print("og image written to", dst)


def from_export(export_dir):
    """Rebuild src/img from the original cPanel export (one-off migration)."""
    e = Path(export_dir)
    img = e / "img"
    c = img / "content"
    s = img / "slider"
    o = OUT_DIR

    # Brand
    optimise(img / "logo.png", o / "logo.png", width=720)
    make_favicons(img / "logo.png", ROOT / "src")
    make_og_image(img / "logo.png", o / "og-image.jpg")

    # Hero slider (CSS background images, full-bleed)
    optimise(s / "slide1.jpg", o / "slider" / "slide-1.webp", width=1920, quality=72)
    optimise(s / "slide2.jpg", o / "slider" / "slide-2.webp", width=1920, quality=72)

    # About page gallery slider
    optimise(s / "company-slide-1.jpg", o / "slider" / "company-slide-1.webp", width=1200)
    optimise(s / "company-slide-2.jpg", o / "slider" / "company-slide-2.webp", width=1200)
    optimise(s / "company-slide-3.jpg", o / "slider" / "company-slide-3.webp", width=1200)

    # Section backgrounds
    optimise(img / "about-page-bg.jpg", o / "about-page-bg.webp", width=1920, quality=70)
    optimise(img / "footer-bg.jpg", o / "footer-bg.webp", width=1920, quality=70)
    optimise(c / "services-bg.jpg", o / "content" / "services-bg.webp", width=1600, quality=68)
    optimise(c / "counter-bg.jpg", o / "content" / "counter-bg.webp", width=1600, quality=70)
    # testimonial-bg.jpg and menu-mobile-bg.jpg were identical -> one file
    optimise(c / "testimonial-bg.jpg", o / "content" / "testimonial-bg.webp", width=1500, quality=66)

    # Service imagery
    for i in range(1, 6):
        optimise(c / f"services-item-{i}.jpg", o / "content" / f"services-item-{i}.webp", width=1200)
    for i in range(1, 7):
        optimise(c / f"services-thumb-{i}.jpg", o / "content" / f"services-thumb-{i}.webp", quality=80)
    optimise(c / "service-1.jpg", o / "content" / "service-ship.webp", quality=80)
    optimise(c / "service-calculator-img.png", o / "content" / "forklift.webp", width=600, quality=85)

    # About page
    for i in range(1, 4):
        optimise(c / f"company-thumb-{i}.jpg", o / "content" / f"company-thumb-{i}.webp", quality=80)
    optimise(c / "team-2.jpg", o / "content" / "team-1.webp", width=600, quality=80)

    # Small UI assets kept as-is
    optimise(c / "quote.png", o / "content" / "quote.png")
    (o).mkdir(parents=True, exist_ok=True)
    (o / "plus.svg").write_bytes((img / "plus.svg").read_bytes())


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("src", nargs="?", help="input image")
    p.add_argument("dst", nargs="?", help="output image (.webp/.jpg/.png)")
    p.add_argument("--width", type=int, help="max width in px (never upscales)")
    p.add_argument("--height", type=int, help="max height in px")
    p.add_argument("--quality", type=int, default=78)
    p.add_argument("--from-export", metavar="DIR", help="rebuild src/img from the original site export")
    a = p.parse_args()

    if a.from_export:
        from_export(a.from_export)
    elif a.src and a.dst:
        optimise(a.src, a.dst, a.width, a.height, a.quality)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
