# Writes solid-color PNG icons with no dependencies. Run: python3 scripts/make-icons.py
import struct
import zlib


def png(path, size, rgb):
    raw = b''.join(b'\x00' + bytes(rgb) * size for _ in range(size))

    def chunk(tag, body):
        return struct.pack('>I', len(body)) + tag + body + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(data)


png('public/icons/icon-512.png', 512, (52, 199, 89))
png('public/icons/apple-touch-icon.png', 180, (52, 199, 89))
print('icons written')
