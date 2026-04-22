from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]

ASSET_GROUPS = [
    {
        "src": ROOT / "public/brand/symbol/anansi-symbol-primary.png",
        "transparent": ROOT / "public/brand/symbol/anansi-symbol-primary-transparent.png",
        "darksite": ROOT / "public/brand/symbol/anansi-symbol-primary-darksite.png",
        "hero_light": ROOT / "public/brand/symbol/anansi-symbol-primary-hero-light.png",
    },
    {
        "src": ROOT / "public/brand/symbol/anansi-symbol-alt.png",
        "transparent": ROOT / "public/brand/symbol/anansi-symbol-alt-transparent.png",
        "darksite": ROOT / "public/brand/symbol/anansi-symbol-alt-darksite.png",
    },
    {
        "src": ROOT / "public/brand/symbol/anansi-symbol-hero.png",
        "transparent": ROOT / "public/brand/symbol/anansi-symbol-hero-transparent.png",
        "darksite": ROOT / "public/brand/symbol/anansi-symbol-hero-darksite.png",
    },
]


def clamp(value: float) -> int:
    return max(0, min(255, int(round(value))))


def is_light_neutral(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = pixel
    hi = max(r, g, b)
    lo = min(r, g, b)
    avg = (r + g + b) / 3
    return avg >= 188 and (hi - lo) <= 34


def crop_to_visible_bounds(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    return image.crop(bbox) if bbox else image


def remove_white_matte(src_path: Path) -> Image.Image:
    image = Image.open(src_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = [[False] * height for _ in range(width)]
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        if 0 <= x < width and 0 <= y < height and not visited[x][y]:
            visited[x][y] = True
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if not is_light_neutral(pixels[x, y]):
            continue

        pixels[x, y] = (255, 255, 255, 0)
        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)

    for x in range(width):
        for y in range(height):
            r, g, b, _ = pixels[x, y]

            if pixels[x, y][3] == 0:
                continue

            alpha = max(255 - r, 255 - g, 255 - b)
            if alpha <= 3:
                pixels[x, y] = (255, 255, 255, 0)
                continue

            matte = 255 - alpha
            new_r = clamp((r - matte) * 255 / alpha)
            new_g = clamp((g - matte) * 255 / alpha)
            new_b = clamp((b - matte) * 255 / alpha)
            pixels[x, y] = (new_r, new_g, new_b, alpha)

    return crop_to_visible_bounds(image)


def make_darksite_variant(image: Image.Image) -> Image.Image:
    darksite = image.copy()
    pixels = darksite.load()
    width, height = darksite.size

    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            # Tone down the internal white accent strokes so they don't glow
            # too loudly on the dark landing hero.
            if r >= 235 and g >= 235 and b >= 235:
                pixels[x, y] = (132, 135, 142, clamp(a * 0.68))
                continue

            # Keep the reds vivid and slightly richer.
            if r >= 175 and g <= 90 and b <= 90:
                pixels[x, y] = (220, 26, 38, clamp(a * 1.03))
                continue

            # Deepen the charcoal body so it doesn't read gray on black.
            if r <= 60 and g <= 60 and b <= 70:
                pixels[x, y] = (17, 18, 22, a)

    return darksite


def make_hero_light_variant(image: Image.Image) -> Image.Image:
    hero = image.copy()
    pixels = hero.load()
    width, height = hero.size

    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            # Keep the red crown vivid for the hero focal point.
            if r >= 170 and g <= 105 and b <= 105:
                pixels[x, y] = (234, 30, 40, a)
                continue

            # Convert bright inner accent strokes to a cool silver so they
            # remain visible against the white body without shouting.
            if r >= 235 and g >= 235 and b >= 235:
                pixels[x, y] = (198, 205, 217, clamp(a * 0.96))
                continue

            # Lift the dark body to a crisp off-white.
            if r <= 70 and g <= 70 and b <= 80:
                pixels[x, y] = (248, 250, 252, a)

    return hero


def main() -> None:
    for group in ASSET_GROUPS:
        transparent = remove_white_matte(group["src"])
        transparent.save(group["transparent"])
        print(f"wrote {group['transparent'].relative_to(ROOT)}")

        darksite = make_darksite_variant(transparent)
        darksite.save(group["darksite"])
        print(f"wrote {group['darksite'].relative_to(ROOT)}")

        if "hero_light" in group:
            hero_light = make_hero_light_variant(transparent)
            hero_light.save(group["hero_light"])
            print(f"wrote {group['hero_light'].relative_to(ROOT)}")


if __name__ == "__main__":
    main()
