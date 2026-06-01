from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(r"C:\Users\User\Documents\Github\solKidGalGame")
GEN = Path(r"C:\Users\User\Documents\Github\codexHome\generated_images\019e81aa-fd17-7a41-ad34-251ef56e60ad")
HELPER = Path(r"C:\Users\User\Documents\Github\codexHome\skills\.system\imagegen\scripts\remove_chroma_key.py")
LOG_QA = ROOT / ".codex" / "log" / "20260601-135745-qa"
ORIGINALS = LOG_QA / "original-assets"

GENERATED = [
    "ig_07743bbfb8703463016a1d1fe2094081918764fc07a4257006.png",
    "ig_07743bbfb8703463016a1d209ac20081919856d641979aabc0.png",
    "ig_07743bbfb8703463016a1d20d69530819189fb0ac0106369db.png",
    "ig_07743bbfb8703463016a1d211a0c488191bbe9e9466effd3a9.png",
    "ig_07743bbfb8703463016a1d21786aa48191945f2fe2ceae02f9.png",
    "ig_07743bbfb8703463016a1d21baabbc819185b4f5753c0a8c11.png",
    "ig_07743bbfb8703463016a1d21ef62948191bf60427cee4d086c.png",
    "ig_07743bbfb8703463016a1d224ae24c81918e69dbfe452e0189.png",
    "ig_07743bbfb8703463016a1d229561d48191843c1aafbc97aedb.png",
    "ig_07743bbfb8703463016a1d23396c6481919aef1ce55bb82530.png",
]

BACKGROUND_TARGETS = [
    "market.png",
    "boutique.png",
    "shoes.png",
    "accessory.png",
    "garden.png",
    "harbor.png",
    "farm.png",
    "lighthouse.png",
]

NPC_TARGETS = [
    "npc-shoes.png",
    "npc-accessory.png",
]


def backup(path: Path) -> None:
    if path.exists():
        target = ORIGINALS / path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def cover_resize(src: Path, dst: Path, size: tuple[int, int] = (1280, 720)) -> None:
    image = Image.open(src).convert("RGB")
    src_w, src_h = image.size
    target_w, target_h = size
    scale = max(target_w / src_w, target_h / src_h)
    resized = image.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - target_w) // 2)
    top = max(0, (resized.height - target_h) // 2)
    cropped = resized.crop((left, top, left + target_w, top + target_h))
    dst.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dst, "PNG", optimize=True)


def validate_alpha(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    extrema = alpha.getextrema()
    if extrema[0] >= 5:
        raise RuntimeError(f"{path} does not have transparent edges")


def process() -> None:
    LOG_QA.mkdir(parents=True, exist_ok=True)
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    for index, target_name in enumerate(BACKGROUND_TARGETS):
        source = GEN / GENERATED[index]
        target = ROOT / "assets" / "scenes" / target_name
        backup(target)
        cover_resize(source, target)

    for offset, target_name in enumerate(NPC_TARGETS, start=len(BACKGROUND_TARGETS)):
        source = GEN / GENERATED[offset]
        chroma_source = LOG_QA / f"{target_name.removesuffix('.png')}-source.png"
        target = ROOT / "assets" / "characters" / target_name
        backup(target)
        shutil.copy2(source, chroma_source)
        subprocess.run(
            [
                sys.executable,
                str(HELPER),
                "--input",
                str(chroma_source),
                "--out",
                str(target),
                "--auto-key",
                "border",
                "--soft-matte",
                "--transparent-threshold",
                "12",
                "--opaque-threshold",
                "220",
                "--despill",
                "--edge-contract",
                "1",
            ],
            check=True,
        )
        validate_alpha(target)


if __name__ == "__main__":
    process()
