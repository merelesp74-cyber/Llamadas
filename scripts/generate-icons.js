import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, isMaskable = false) {
  // RGBA buffer: width * 4 bytes per row + 1 filter byte per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize, 0);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.45);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient from Blue (#1f6feb) to Emerald/Teal (#0ea5e9)
        const t = (x + y) / (width + height);
        const r = Math.round(31 * (1 - t) + 14 * t);
        const g = Math.round(111 * (1 - t) + 165 * t);
        const b = Math.round(235 * (1 - t) + 233 * t);

        // Draw a central video camera icon (simplified shape)
        const iconSize = radius * 0.55;
        const ix = Math.abs(dx);
        const iy = Math.abs(dy);

        // Camera body: rounded rect
        const inBody = dx >= -iconSize * 0.7 && dx <= iconSize * 0.3 && iy <= iconSize * 0.45;
        // Camera lens: triangle
        const inLens = dx > iconSize * 0.35 && dx <= iconSize * 0.75 && iy <= (dx - iconSize * 0.3) * 0.7;

        if (inBody || inLens) {
          // White camera icon
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Gradient background
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else if (isMaskable) {
        // Full bleed background for maskable
        rawData[pixelOffset] = 22; // #161c26
        rawData[pixelOffset + 1] = 28;
        rawData[pixelOffset + 2] = 38;
        rawData[pixelOffset + 3] = 255;
      } else {
        // Transparent outside circle
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 calculation
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

// Standard CRC32
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, true));

// Create SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1f6feb"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect x="110" y="156" width="200" height="200" rx="24" fill="white"/>
  <path d="M340 200L410 156V356L340 312V200Z" fill="white"/>
  <circle cx="210" cy="256" r="40" fill="#1f6feb"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8');

console.log('PWA PNG and SVG icons generated successfully!');
