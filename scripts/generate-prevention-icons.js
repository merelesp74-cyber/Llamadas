import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPreventionPng(width, height, isMaskable = false) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize, 0);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  // Shield dimensions in 512 base scale
  const shieldTop = -160 * scale;
  const shieldMid = 40 * scale;
  const shieldBottom = 175 * scale;
  const shieldHalfW = 145 * scale;

  // Cross dimensions
  const armLen = 75 * scale;
  const armThick = 26 * scale;

  function insideShield(x, y) {
    if (y < shieldTop || y > shieldBottom) return false;
    if (y <= shieldMid) {
      // Top rectangular portion with rounded top corners
      const dyTop = y - (shieldTop + 30 * scale);
      if (dyTop < 0) {
        const dx = Math.abs(x) - (shieldHalfW - 30 * scale);
        if (dx > 0 && Math.sqrt(dx * dx + dyTop * dyTop) > 30 * scale) return false;
      }
      return Math.abs(x) <= shieldHalfW;
    } else {
      // Bottom converging to point (0, shieldBottom)
      const t = (y - shieldMid) / (shieldBottom - shieldMid);
      const curHalfW = shieldHalfW * (1 - Math.pow(t, 1.4));
      return Math.abs(x) <= curHalfW;
    }
  }

  function insideCross(x, y) {
    const cyCross = -5 * scale;
    const dy = y - cyCross;
    const inV = Math.abs(x) <= armThick && Math.abs(dy) <= armLen;
    const inH = Math.abs(x) <= armLen && Math.abs(dy) <= armThick;
    return inV || inH;
  }

  const borderThickness = 12 * scale;
  const innerMargin = 16 * scale;

  for (let py = 0; py < height; py++) {
    const rowOffset = py * rowSize;
    rawData[rowOffset] = 0; // Filter 0

    const y = py - cy;

    for (let px = 0; px < width; px++) {
      const pixelOffset = rowOffset + 1 + px * 4;
      const x = px - cx;
      const distFromCenter = Math.sqrt(x * x + y * y);

      const inOuterShield = insideShield(x, y);
      const inInnerShield = insideShield(x * 1.12, (y - 5 * scale) * 1.12);
      const onBorder = inOuterShield && !inInnerShield;
      const onCross = insideCross(x, y);

      if (onCross) {
        // Pure White Safety Cross of Risk Prevention
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 255;
      } else if (inInnerShield) {
        // Rich Emerald Safety Green Gradient (#047857 to #10b981)
        const t = (py / height);
        rawData[pixelOffset] = Math.round(5 * (1 - t) + 16 * t);
        rawData[pixelOffset + 1] = Math.round(135 * (1 - t) + 185 * t);
        rawData[pixelOffset + 2] = Math.round(85 * (1 - t) + 129 * t);
        rawData[pixelOffset + 3] = 255;
      } else if (onBorder) {
        // Golden / Amber Shield Border (#f59e0b)
        rawData[pixelOffset] = 245;
        rawData[pixelOffset + 1] = 166;
        rawData[pixelOffset + 2] = 35;
        rawData[pixelOffset + 3] = 255;
      } else {
        if (isMaskable) {
          // Dark Navy Background for Android squircle safe-zone
          rawData[pixelOffset] = 15; // #0f172a
          rawData[pixelOffset + 1] = 23;
          rawData[pixelOffset + 2] = 42;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Circular rounded badge or transparent
          const cornerR = width * 0.46;
          if (distFromCenter <= cornerR) {
            // Dark elegant disc container for the emblem
            rawData[pixelOffset] = 15;
            rawData[pixelOffset + 1] = 23;
            rawData[pixelOffset + 2] = 42;
            rawData[pixelOffset + 3] = 255;
          } else {
            rawData[pixelOffset] = 0;
            rawData[pixelOffset + 1] = 0;
            rawData[pixelOffset + 2] = 0;
            rawData[pixelOffset + 3] = 0;
          }
        }
      }
    }
  }

  // PNG Construction
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

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

// Generate all PNG icons with the Prevention of Risks Safety Emblem
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPreventionPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPreventionPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPreventionPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPreventionPng(180, 180, true));

// Create ultra crisp SVG for the Risk Prevention Logo
const preventionSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <!-- Dark Circular Background -->
  <rect width="512" height="512" rx="128" fill="#0f172a"/>
  
  <!-- Outer Gold Laurel / Shield Halo -->
  <path d="M256 60 C370 60 410 88 410 180 C410 320 256 440 256 440 C256 440 102 320 102 180 C102 88 142 60 256 60 Z" fill="#f59e0b"/>
  
  <!-- Inner Prevention Green Shield -->
  <path d="M256 78 C352 78 390 102 390 184 C390 306 256 414 256 414 C256 414 122 306 122 184 C122 102 160 78 256 78 Z" fill="url(#greenGrad)"/>
  
  <defs>
    <linearGradient id="greenGrad" x1="256" y1="78" x2="256" y2="414" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <!-- Universal White Safety / Prevention Cross -->
  <g filter="url(#shadow)">
    <!-- Vertical Arm -->
    <rect x="226" y="160" width="60" height="160" rx="12" fill="#ffffff"/>
    <!-- Horizontal Arm -->
    <rect x="176" y="210" width="160" height="60" rx="12" fill="#ffffff"/>
  </g>
  
  <!-- Small Star / Badge of Protection -->
  <circle cx="256" cy="120" r="10" fill="#fef08a"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), preventionSvg, 'utf-8');

console.log('Prevención de Riesgos icons and SVG generated successfully!');
