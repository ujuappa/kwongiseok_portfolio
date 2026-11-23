"""Prepare the character art for the site.

Reads the hand-drawn sheets in characters/<id>/source/ (never edits them) and
writes, for each character:

  public/assets/characters/<id>/portrait.png       character select
  public/assets/characters/<id>/fall-<pose>.png    freefall, parachute, landing
  public/assets/characters/<id>/walk.png + .json   village sprite sheet

plus src/lib/character-art.json, the measurements the site reads (sizes, head
positions, strap positions, sprite cells). Missing source files are skipped,
and the site falls back for whatever is missing.

Run from the repo root:  python scripts/characters/process.py
Needs Pillow, NumPy and SciPy. See characters/character-assets-handoff.md.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from cutout import find_figures, scale, sort_grid  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "characters"
OUT = ROOT / "public" / "assets" / "characters"
DATA = ROOT / "src" / "lib" / "character-art.json"
PREVIEW = Path(__file__).parent / "preview.html"

# Output sizes, in image pixels. Images are drawn at about half this on screen,
# so they stay sharp on 2x displays.
FACE_PX = 64  # face width in the fall poses
PORTRAIT_H = 360
WALK_FIGURE_H = 168  # standing height of the village sprite

POSES = ("freefall", "parachute", "landing")

# Per character, per fall pose: the face width and face centre in source pixels,
# measured by hand. The poses are drawn at different sizes (visitor-01's
# freefall is smaller), so each is scaled to the same face width, and the face
# centre is the point the fall holds still when the pose changes.
FACES = {
    "visitor-01": {
        "freefall": (94, (349, 345)),
        "parachute": (117, (838, 175)),
        "landing": (117, (1278, 515)),
    },
    "visitor-02": {
        "freefall": (88, (395, 268)),
        "parachute": (93, (957, 198)),
        "landing": (92, (1471, 415)),
    },
}


def rel(path: Path) -> str:
    """Path the site uses, relative to the base URL (pass it through url())."""
    return path.relative_to(ROOT / "public").as_posix()


def save(img: Image.Image, path: Path) -> None:
    """Save as a 256-colour PNG with alpha: about a fifth of the size of a
    full-colour one, and the flat-shaded art looks the same."""
    path.parent.mkdir(parents=True, exist_ok=True)
    q = img.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(path, optimize=True)


def process_fall(cid: str, src: Path, out: Path) -> dict | None:
    sheet = src / "fall.png"
    faces = FACES.get(cid)
    if not sheet.exists() or not faces:
        return None
    figures = sorted(find_figures(sheet, 3), key=lambda f: f.center[0])
    poses = {}
    for name, fig in zip(POSES, figures):
        face_w, (fx, fy) = faces[name]
        k = FACE_PX / face_w
        img = scale(fig.image, k)
        l, t, _, _ = fig.box
        entry = {
            "src": rel(out / f"fall-{name}.png"),
            "w": img.width,
            "h": img.height,
            # Face centre within this image.
            "head": [round((fx - l) * k, 1), round((fy - t) * k, 1)],
        }
        if name == "parachute":
            entry["straps"] = strap_tops(img)
        save(img, out / f"fall-{name}.png")
        poses[name] = entry
    return {"face": FACE_PX, **poses}


def strap_tops(img: Image.Image) -> list[list[float]]:
    """Centre x and width of each harness strap where it leaves the top edge.
    The canopy lines are drawn down to these points."""
    alpha = np.asarray(img)[:3, :, 3].max(axis=0) > 128
    runs, start = [], None
    for x, on in enumerate(list(alpha) + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            runs.append([round((start + x - 1) / 2, 1), x - start])
            start = None
    if len(runs) != 2:
        raise ValueError(f"expected two straps on the top edge, found {len(runs)}")
    return runs


def process_portrait(src: Path, out: Path) -> dict | None:
    """portrait.png if it exists, else the front view of the turnaround."""
    if (src / "portrait.png").exists():
        fig, temporary = find_figures(src / "portrait.png", 1)[0], False
    elif (src / "turnaround.png").exists():
        views = sorted(find_figures(src / "turnaround.png", 4), key=lambda f: f.center[0])
        fig, temporary = views[0], True
    else:
        return None
    img = scale(fig.image, PORTRAIT_H / fig.image.height)
    save(img, out / "portrait.png")
    return {"src": rel(out / "portrait.png"), "w": img.width, "h": img.height, "temporary": temporary}


def process_walk(src: Path, out: Path) -> dict | None:
    """Walk sheet: 3 rows (down, left, up) x 4 columns (stand, step A, stand,
    step B), each frame in an equal cell anchored at the feet."""
    sheet = src / "village-walk.png"
    if not sheet.exists():
        return None
    grid = sort_grid(find_figures(sheet, 12, pad=2), rows=3)

    frames = []
    for row in grid:
        # One scale per row, so the standing frame is the same height in
        # every direction and the steps keep their bounce.
        k = WALK_FIGURE_H / row[0].image.height
        frames.append([scale(f.image, k) for f in row])

    def head_x(img: Image.Image) -> float:
        """Centre of mass of the top 40%: keeps the body still across frames."""
        a = np.asarray(img)[: int(img.height * 0.4), :, 3].astype(float)
        cols = a.sum(axis=0)
        return float((cols * np.arange(len(cols))).sum() / cols.sum())

    left = max(head_x(i) for r in frames for i in r)
    right = max(i.width - head_x(i) for r in frames for i in r)
    pad = 4
    cell_w = int(np.ceil(max(left, right) * 2)) + pad * 2
    cell_h = max(i.height for r in frames for i in r) + pad
    anchor = [cell_w / 2, cell_h - pad / 2]

    sheet_img = Image.new("RGBA", (cell_w * 4, cell_h * 3), (0, 0, 0, 0))
    for r, row in enumerate(frames):
        for c, img in enumerate(row):
            x = round(c * cell_w + anchor[0] - head_x(img))
            y = round(r * cell_h + anchor[1] - img.height)
            sheet_img.alpha_composite(img, (x, y))
    save(sheet_img, out / "walk.png")

    meta = {
        "src": rel(out / "walk.png"),
        "rows": 3,
        "cols": 4,
        "cell": [cell_w, cell_h],
        # Feet: the point that stands on the ground, within a cell.
        "anchor": anchor,
        "rowNames": ["down", "left", "up"],
        "colNames": ["stand", "stepA", "stand", "stepB"],
        "fps": 8,
    }
    (out / "walk.json").write_text(json.dumps(meta, indent=2) + "\n")
    return meta


def main() -> None:
    art = {}
    for src_dir in sorted(SOURCE.glob("*/source")):
        cid = src_dir.parent.name
        out = OUT / cid
        entry = {
            "portrait": process_portrait(src_dir, out),
            "fall": process_fall(cid, src_dir, out),
            "walk": process_walk(src_dir, out),
        }
        art[cid] = {k: v for k, v in entry.items() if v is not None}
        print(cid, "->", ", ".join(art[cid]) or "nothing")
    DATA.write_text(
        json.dumps(
            {"_note": "Generated by scripts/characters/process.py. Do not edit.", **art},
            indent=2,
        )
        + "\n"
    )
    PREVIEW.write_text(
        PREVIEW.with_name("preview.template.html")
        .read_text(encoding="utf-8")
        .replace("/*ART*/null", json.dumps(art)),
        encoding="utf-8",
    )
    print("preview:", PREVIEW.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
