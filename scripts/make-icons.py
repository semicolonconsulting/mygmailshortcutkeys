"""Draws the extension icon (a white keyboard on a charcoal tile with a light rim, readable on light and dark toolbars) at every size the manifest needs."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(sys.argv[1] if len(sys.argv) > 1 else "src/icons")
out.mkdir(parents=True, exist_ok=True)

S = 512  # draw large, then downsample for clean edges
TILE = (32, 33, 36, 255)
EDGE = (18, 18, 20, 255)
RIM = (154, 160, 166, 255)  # keeps the tile's outline visible on dark toolbars
WHITE = (255, 255, 255, 255)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# light rim, then the tile with a darker bottom edge
d.rounded_rectangle([8, 8, S - 8, S - 8], radius=104, fill=RIM)
d.rounded_rectangle([16, 32, S - 16, S - 8], radius=96, fill=EDGE)
d.rounded_rectangle([16, 16, S - 16, S - 40], radius=96, fill=TILE)

# keyboard body
kx0, ky0, kx1, ky1 = 72, 136, S - 72, S - 120
d.rounded_rectangle([kx0, ky0, kx1, ky1], radius=36, fill=WHITE)

# keys: three rows, with a space bar on the last
pad, gap = 30, 18
inner_w = (kx1 - kx0) - 2 * pad
rows = 3
key_h = ((ky1 - ky0) - 2 * pad - (rows - 1) * gap) / rows
cols = 6
key_w = (inner_w - (cols - 1) * gap) / cols
for r in range(rows):
    y = ky0 + pad + r * (key_h + gap)
    if r < 2:
        offset = 0 if r == 0 else key_w / 3
        n = cols if r == 0 else cols - 1
        for c in range(n):
            x = kx0 + pad + offset + c * (key_w + gap)
            d.rounded_rectangle([x, y, x + key_w, y + key_h], radius=10, fill=TILE)
    else:
        # small key, space bar, small key
        x = kx0 + pad
        d.rounded_rectangle([x, y, x + key_w, y + key_h], radius=10, fill=TILE)
        sx0 = x + key_w + gap
        sx1 = kx1 - pad - key_w - gap
        d.rounded_rectangle([sx0, y, sx1, y + key_h], radius=10, fill=TILE)
        d.rounded_rectangle([sx1 + gap, y, kx1 - pad, y + key_h], radius=10, fill=TILE)

for size in (16, 32, 48, 128):
    img.resize((size, size), Image.LANCZOS).save(out / f"icon{size}.png")
print("icons written to", out)
