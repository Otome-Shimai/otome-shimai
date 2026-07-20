"""Generate favicon + PWA icons from assets/cover.jpg. Run: python make-icons.py"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

BASE = Path(__file__).parent
SRC = BASE / "assets" / "cover.jpg"
OUT = BASE / "assets" / "icons"
SKY = (35, 180, 255)

SIZES = {
    "favicon.png": 64,
    "icon-180.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    for name, size in SIZES.items():
        src.resize((size, size), Image.LANCZOS).save(OUT / name)
        print(f"wrote {name} ({size}x{size})")

    # maskable: artwork shrunk onto a sky-blue safe-zone background
    canvas = Image.new("RGB", (512, 512), SKY)
    inner = src.resize((410, 410), Image.LANCZOS)
    canvas.paste(inner, ((512 - 410) // 2, (512 - 410) // 2))
    canvas.save(OUT / "icon-512-maskable.png")
    print("wrote icon-512-maskable.png (512x512)")


if __name__ == "__main__":
    main()
