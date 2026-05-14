"""Generate LifeOS PWA icons (PNG) using only the Python stdlib.

Run: python3 scripts/gen-icons.py
Outputs PNGs into public/icons/.
"""
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

BG = (124, 58, 237)     # #7C3AED
FG = (255, 255, 255)


def chunk(type_: bytes, data: bytes) -> bytes:
    length = struct.pack(">I", len(data))
    crc = zlib.crc32(type_ + data) & 0xFFFFFFFF
    return length + type_ + data + struct.pack(">I", crc)


def make_icon(size: int) -> bytes:
    # planner-style: rounded-square background (handled by iOS) with three
    # horizontal "page lines" + a small accent dot.
    line_h = max(2, int(size * 0.07))
    line_x0 = int(size * 0.26)
    line_x1 = int(size * 0.78)
    line_ys = [int(size * 0.36), int(size * 0.50), int(size * 0.64)]
    dot_cx = int(size * 0.20)
    dot_r = int(size * 0.045)

    pixels = bytearray()
    for y in range(size):
        pixels.append(0)  # filter byte
        for x in range(size):
            color = BG
            for ly in line_ys:
                if line_x0 <= x <= line_x1 and abs(y - ly) <= line_h // 2:
                    color = FG
                    break
            else:
                for ly in line_ys:
                    dx, dy = x - dot_cx, y - ly
                    if dx * dx + dy * dy <= dot_r * dot_r:
                        color = FG
                        break
            pixels.extend(color)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(pixels), 9))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in (180, 192, 512):
        path = os.path.join(OUT_DIR, f"icon-{size}.png")
        with open(path, "wb") as f:
            f.write(make_icon(size))
        print(f"wrote {path} ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    main()
