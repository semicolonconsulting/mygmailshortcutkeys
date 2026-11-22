"""Draws the extension icon (a keycap with an envelope) at every size the manifest needs."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(sys.argv[1] if len(sys.argv) > 1 else "src/icons")
out.mkdir(parents=True, exist_ok=True)

S = 512  # draw large, then downsample for clean edges
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# keycap: darker base with lighter top face
d.rounded_rectangle([16, 32, S - 16, S - 8], radius=96, fill=(8, 66, 160, 255))
d.rounded_rectangle([16, 16, S - 16, S - 56], radius=96, fill=(11, 87, 208, 255))
# envelope
x0, y0, x1, y1 = 112, 136, S - 112, S - 168
d.rounded_rectangle([x0, y0, x1, y1], radius=22, fill=(255, 255, 255, 255))
d.line([(x0 + 14, y0 + 16), ((x0 + x1) // 2, (y0 + y1) // 2 + 10), (x1 - 14, y0 + 16)],
       fill=(11, 87, 208, 255), width=26, joint="curve")

for size in (16, 32, 48, 128):
    img.resize((size, size), Image.LANCZOS).save(out / f"icon{size}.png")
print("icons written to", out)
