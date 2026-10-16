from __future__ import annotations

import argparse
import io
import struct
from pathlib import Path

from PIL import Image, ImageDraw


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = PROJECT_ROOT / "public" / "icons"
QA_PATH = PROJECT_ROOT / "docs" / "qa" / "taskbar-icon-sizes.png"
ICO_SIZES = (16, 20, 24, 32, 40, 48, 64, 128, 256)
PNG_SIZES = tuple(sorted(set(ICO_SIZES + (180, 192, 512))))
RED = "#c8422b"
CREAM = "#fff8ee"
WHITE = "#ffffff"
GOLD = "#f3b65d"


def _round(value: float) -> int:
    return max(1, int(round(value)))


def render_icon(size: int) -> Image.Image:
    scale = 1 if size <= 24 else 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def px(value: float) -> int:
        return _round(value * canvas_size)

    draw.rounded_rectangle(
        (px(0.035), px(0.035), px(0.965), px(0.965)),
        radius=px(0.22),
        fill=RED,
    )

    steam_width = max(scale, px(0.052))
    for x in (0.35, 0.50, 0.65):
        draw.line(
            (px(x - 0.018), px(0.34), px(x + 0.018), px(0.20)),
            fill=CREAM,
            width=steam_width,
        )

    draw.rounded_rectangle(
        (px(0.18), px(0.43), px(0.82), px(0.55)),
        radius=px(0.06),
        fill=CREAM,
    )
    draw.polygon(
        ((px(0.22), px(0.51)), (px(0.78), px(0.51)), (px(0.70), px(0.79)), (px(0.30), px(0.79))),
        fill=WHITE,
    )
    draw.rounded_rectangle(
        (px(0.35), px(0.79), px(0.65), px(0.84)),
        radius=px(0.025),
        fill=GOLD,
    )

    if scale > 1:
        image = image.resize((size, size), Image.Resampling.LANCZOS)
    return image


def write_multi_size_ico(path: Path, frames: dict[int, Image.Image]) -> None:
    blobs: list[bytes] = []
    for size in ICO_SIZES:
        buffer = io.BytesIO()
        frames[size].save(buffer, format="PNG", optimize=True)
        blobs.append(buffer.getvalue())

    header_size = 6 + 16 * len(blobs)
    offset = header_size
    entries = []
    for size, blob in zip(ICO_SIZES, blobs, strict=True):
        dimension = 0 if size == 256 else size
        entries.append(struct.pack("<BBBBHHII", dimension, dimension, 0, 0, 1, 32, len(blob), offset))
        offset += len(blob)

    path.write_bytes(struct.pack("<HHH", 0, 1, len(blobs)) + b"".join(entries) + b"".join(blobs))


def write_qa_preview(frames: dict[int, Image.Image]) -> None:
    QA_PATH.parent.mkdir(parents=True, exist_ok=True)
    preview = Image.new("RGB", (880, 300), "#f4f1ed")
    draw = ImageDraw.Draw(preview)
    draw.text((28, 18), "Taskbar icon native-size check", fill="#262421")
    for row, background in enumerate(("#f7f7f7", "#202124")):
        top = 52 + row * 116
        draw.rounded_rectangle((24, top, 856, top + 96), radius=12, fill=background)
        left = 52
        for size in (16, 20, 24, 32, 40, 48):
            icon = frames[size]
            preview.paste(icon, (left, top + 18), icon)
            zoom = icon.resize((size * 2, size * 2), Image.Resampling.NEAREST)
            preview.paste(zoom, (left + 58, top + 8), zoom)
            label_color = "#333333" if row == 0 else "#f2f2f2"
            draw.text((left, top + 72), f"{size}px", fill=label_color)
            left += 132
    preview.save(QA_PATH, optimize=True)


def generate() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    frames = {size: render_icon(size) for size in PNG_SIZES}
    for size, image in frames.items():
        image.save(ICON_DIR / f"app-icon-{size}.png", optimize=True)
    write_multi_size_ico(ICON_DIR / "app-icon.ico", frames)
    write_multi_size_ico(ICON_DIR / "favicon.ico", frames)
    write_qa_preview(frames)


def read_ico_sizes(path: Path) -> list[int]:
    data = path.read_bytes()
    reserved, icon_type, count = struct.unpack_from("<HHH", data)
    if (reserved, icon_type) != (0, 1):
        raise ValueError(f"Invalid ICO header: {path}")
    return [256 if data[6 + index * 16] == 0 else data[6 + index * 16] for index in range(count)]


def check() -> None:
    missing = [str(ICON_DIR / f"app-icon-{size}.png") for size in PNG_SIZES if not (ICON_DIR / f"app-icon-{size}.png").is_file()]
    missing += [str(path) for path in (ICON_DIR / "app-icon.svg", ICON_DIR / "app-icon-small.svg", ICON_DIR / "app-icon.ico", ICON_DIR / "favicon.ico", QA_PATH) if not path.is_file()]
    if missing:
        raise SystemExit("Missing icon assets:\n" + "\n".join(missing))
    actual_sizes = read_ico_sizes(ICON_DIR / "app-icon.ico")
    if actual_sizes != list(ICO_SIZES):
        raise SystemExit(f"ICO sizes mismatch: {actual_sizes}")
    for size in PNG_SIZES:
        with Image.open(ICON_DIR / f"app-icon-{size}.png") as image:
            if image.size != (size, size):
                raise SystemExit(f"PNG size mismatch: {size} -> {image.size}")
    print(f"Verified icon assets: ICO frames {actual_sizes}; PNG sizes {list(PNG_SIZES)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate and verify 家常一桌 icon assets.")
    parser.add_argument("--check", action="store_true", help="Verify generated icon dimensions and ICO frames.")
    args = parser.parse_args()
    check() if args.check else generate()
