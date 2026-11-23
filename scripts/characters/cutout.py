"""Cut hand-drawn figures out of a sheet with a near-white background.

The sheets are drawn with a thick dark outline on a white background, and the
figures are spaced by eye, so each figure is found by its connected pixels
rather than by a grid. See characters/character-assets-handoff.md.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image
from scipy import ndimage

# A pixel is "background-like" when every channel is this bright and it has
# almost no colour. visitor-01's off-white shirt peaks around 234 in its
# darkest channel, so it stays out; connectivity does the rest.
BG_MIN = 236
BG_CHROMA = 14
# Enclosed background (a gap between hair strands, or between a hand and a
# strap) is cleared when it is as clean and neutral as the sheet itself. White
# shapes that belong to the drawing stay: buckle frames (rings), pearls and
# pendants (small round blobs), and eye shines (white inside a dark eye).
ENCLOSED_MIN = 246
ENCLOSED_CHROMA = 2.0
ENCLOSED_MIN_AREA = 15
SLIVER_ASPECT = 2.2  # bounding-box aspect ratio; eye shines stay under 2
BLOB_MAX_AREA = 160
BLOB_MIN_RADIUS = 3.5
BLOB_MAX_ASPECT = 1.6
SHINE_DARK = 90  # darkest channel below this counts as "eye"
SHINE_SHARE = 0.55  # share of the surrounding ring that must be eye
# Edge band, in source pixels, where the outline fades into the background.
EDGE_BAND = 2.0


@dataclass
class Figure:
    """One figure on a sheet: its RGBA cutout and where it sat on the sheet."""

    image: Image.Image
    box: tuple[int, int, int, int]  # left, top, right, bottom on the sheet

    @property
    def center(self) -> tuple[float, float]:
        l, t, r, b = self.box
        return (l + r) / 2, (t + b) / 2


def load(path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32)


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """True where the sheet is background: outside the figures, or a clean
    enclosed gap inside one."""
    lo = rgb.min(axis=2)
    chroma = rgb.max(axis=2) - lo
    bgish = (lo >= BG_MIN) & (chroma <= BG_CHROMA)

    # 4-connectivity so the fill can't slip diagonally through a thin outline.
    labels, n = ndimage.label(bgish)
    edge_ids = np.unique(
        np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    )
    outside = np.isin(labels, edge_ids[edge_ids > 0])

    enclosed = np.zeros_like(outside)
    depth = ndimage.distance_transform_edt(bgish)
    H, W = lo.shape
    for i, s in enumerate(ndimage.find_objects(labels), start=1):
        if s is None or i in edge_ids:
            continue
        region = labels[s] == i
        area = int(region.sum())
        if (
            area < ENCLOSED_MIN_AREA
            or lo[s][region].mean() < ENCLOSED_MIN
            or chroma[s][region].mean() > ENCLOSED_CHROMA
        ):
            continue
        if ndimage.binary_fill_holes(region).sum() > area:
            continue  # a ring: buckle frame
        h, w = region.shape
        aspect = max(h, w) / min(h, w)
        if aspect >= SLIVER_ASPECT or area >= BLOB_MAX_AREA:
            enclosed[s] |= region  # a sliver or a wide gap
            continue
        if depth[s][region].max() >= BLOB_MIN_RADIUS and aspect < BLOB_MAX_ASPECT:
            continue  # a small round blob: pearl, pendant
        # Eye shine: the band a few pixels out is mostly the dark eye.
        y0, y1 = max(s[0].start - 6, 0), min(s[0].stop + 6, H)
        x0, x1 = max(s[1].start - 6, 0), min(s[1].stop + 6, W)
        local = labels[y0:y1, x0:x1] == i
        ring = ndimage.binary_dilation(local, iterations=5) & ~ndimage.binary_dilation(
            local, iterations=2
        )
        if (lo[y0:y1, x0:x1][ring] < SHINE_DARK).mean() >= SHINE_SHARE:
            continue
        enclosed[s] |= region
    return outside | enclosed


def soft_alpha(rgb: np.ndarray, bg: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Alpha and de-haloed colour for the whole sheet.

    In a thin band along the edge, each pixel is treated as a mix of the
    nearest solid figure colour and the white background, and unmixed. The
    band takes the solid colour, so no white fringe survives on dark pages.
    """
    fig = ~bg
    dist = ndimage.distance_transform_edt(fig)
    interior = dist > EDGE_BAND
    band = fig & ~interior

    # Colour of the nearest interior pixel, for every pixel.
    _, (iy, ix) = ndimage.distance_transform_edt(~interior, return_indices=True)
    solid = rgb[iy, ix]

    white = np.array([254.0, 254.0, 254.0], dtype=np.float32)
    d_fg = white - solid
    d_obs = white - rgb
    denom = (d_fg * d_fg).sum(axis=2)
    a = np.where(denom > 1, (d_obs * d_fg).sum(axis=2) / np.maximum(denom, 1), 1.0)
    a = np.clip(a, 0.0, 1.0)

    alpha = np.zeros(bg.shape, np.float32)
    alpha[interior] = 1.0
    alpha[band] = a[band]
    color = rgb.copy()
    color[band] = solid[band]
    return alpha, color


def find_figures(path, count: int, pad: int = 6) -> list[Figure]:
    """Cut the `count` largest figures out of a sheet, in reading order is up
    to the caller (see sort_grid)."""
    rgb = load(path)
    bg = background_mask(rgb)
    alpha, color = soft_alpha(rgb, bg)

    solid = alpha > 0.05
    labels, n = ndimage.label(solid, structure=np.ones((3, 3)))
    ids = np.arange(1, n + 1)
    areas = ndimage.sum(np.ones(solid.shape), labels, ids)
    order = ids[np.argsort(areas)[::-1]]
    main = list(order[:count])
    if len(main) < count:
        raise ValueError(f"{path}: found {len(main)} figures, expected {count}")

    # Detached bits (a strand of hair, a speck of outline) join the nearest
    # figure if they are close to it, and are dropped as noise otherwise.
    slices = ndimage.find_objects(labels)
    groups = {i: [i] for i in main}
    min_bit = 0.00002 * solid.size
    for i in order[count:]:
        if areas[i - 1] < min_bit:
            continue
        s = slices[i - 1]
        cy, cx = (s[0].start + s[0].stop) / 2, (s[1].start + s[1].stop) / 2
        best, best_d = None, 1e9
        for m in main:
            ms = slices[m - 1]
            dy = max(ms[0].start - cy, 0, cy - ms[0].stop)
            dx = max(ms[1].start - cx, 0, cx - ms[1].stop)
            d = (dx * dx + dy * dy) ** 0.5
            if d < best_d:
                best, best_d = m, d
        if best is not None and best_d < 40:
            groups[best].append(i)

    h, w = solid.shape
    figures = []
    for m, members in groups.items():
        mask = np.isin(labels, members)
        ys, xs = np.nonzero(mask)
        l, t = max(xs.min() - pad, 0), max(ys.min() - pad, 0)
        r, b = min(xs.max() + 1 + pad, w), min(ys.max() + 1 + pad, h)
        # Grow the mask by a pixel so the soft edge comes along with it.
        grown = ndimage.binary_dilation(mask, iterations=2)
        a = np.where(grown, alpha, 0.0)
        rgba = np.dstack([color, a * 255.0])[t:b, l:r]
        img = Image.fromarray(np.clip(rgba + 0.5, 0, 255).astype(np.uint8), "RGBA")
        figures.append(Figure(img, (int(l), int(t), int(r), int(b))))
    return figures


def sort_grid(figures: list[Figure], rows: int) -> list[list[Figure]]:
    """Group figures into rows (top to bottom), each sorted left to right."""
    by_y = sorted(figures, key=lambda f: f.center[1])
    per_row = len(figures) // rows
    return [
        sorted(by_y[r * per_row : (r + 1) * per_row], key=lambda f: f.center[0])
        for r in range(rows)
    ]


def scale(img: Image.Image, factor: float) -> Image.Image:
    """Resize with premultiplied alpha so edges don't pick up dark or light fringes."""
    w, h = img.size
    size = (max(1, round(w * factor)), max(1, round(h * factor)))
    return img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")
