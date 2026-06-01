from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(r"C:\Users\User\Documents\Github\solKidGalGame")
TARGETS = [
    ROOT / "assets" / "characters" / "npc-shoes.png",
    ROOT / "assets" / "characters" / "npc-accessory.png",
]


def trim_alpha(path: Path, padding_ratio: float = 0.045) -> None:
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"No visible pixels in {path}")
    left, top, right, bottom = bbox
    pad = round(max(right - left, bottom - top) * padding_ratio)
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    cropped = image.crop((left, top, right, bottom))
    cropped.save(path, "PNG", optimize=True)


if __name__ == "__main__":
    for target in TARGETS:
        trim_alpha(target)
