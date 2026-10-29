import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// High-contrast, sharp SVG with "PREVENCIÓN NOCTURNO"
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Night Sky Gradient -->
    <linearGradient id="nightBg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#050814"/>
      <stop offset="50%" stop-color="#0a1226"/>
      <stop offset="100%" stop-color="#111c38"/>
    </linearGradient>

    <!-- Golden Accent Gradient -->
    <linearGradient id="goldGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Emerald Safety Gradient -->
    <linearGradient id="shieldGrad" x1="256" y1="80" x2="256" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#38bdf8" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" rx="110" fill="url(#nightBg)"/>
  
  <!-- Subtle Nocturnal Constellation Stars -->
  <circle cx="80" cy="90" r="3" fill="#ffffff" opacity="0.6"/>
  <circle cx="120" cy="140" r="2" fill="#38bdf8" opacity="0.8"/>
  <circle cx="430" cy="110" r="3.5" fill="#ffffff" opacity="0.7"/>
  <circle cx="390" cy="160" r="2" fill="#facc15" opacity="0.8"/>
  <circle cx="90" cy="380" r="2.5" fill="#ffffff" opacity="0.5"/>
  <circle cx="420" cy="390" r="3" fill="#38bdf8" opacity="0.6"/>

  <!-- Golden Crescent Moon Embracing the Emblem -->
  <path d="M210 65 C140 85 90 150 90 228 C90 320 165 395 258 395 C286 395 312 388 335 375 C240 375 165 300 165 205 C165 140 200 85 252 65 C238 63 224 63 210 65 Z" 
        fill="url(#goldGrad)" opacity="0.95" filter="url(#shadow)"/>

  <!-- Outer Shield Frame -->
  <path d="M256 95 C335 95 365 115 365 185 C365 280 256 360 256 360 C256 360 147 280 147 185 C147 115 177 95 256 95 Z" 
        fill="#0a1329" stroke="url(#goldGrad)" stroke-width="7" filter="url(#shadow)"/>

  <!-- Inner Safety Shield Body -->
  <path d="M256 110 C322 110 348 126 348 185 C348 266 256 338 256 338 C256 338 164 266 164 185 C164 126 190 110 256 110 Z" 
        fill="url(#shieldGrad)"/>

  <!-- White Safety Cross of Risk Prevention -->
  <g filter="url(#shadow)">
    <!-- Vertical bar -->
    <rect x="238" y="155" width="36" height="105" rx="8" fill="#ffffff"/>
    <!-- Horizontal bar -->
    <rect x="204" y="189.5" width="104" height="36" rx="8" fill="#ffffff"/>
  </g>

  <!-- Nocturnal Radar/Eye Core Accent -->
  <circle cx="256" cy="207.5" r="9" fill="#047857"/>
  <circle cx="256" cy="207.5" r="4.5" fill="#facc15"/>

  <!-- Text: PREVENCIÓN -->
  <g filter="url(#shadow)">
    <rect x="56" y="390" width="400" height="48" rx="14" fill="#0a1226" stroke="#f59e0b" stroke-width="2.5" opacity="0.95"/>
    <text x="256" y="423" 
          font-family="system-ui, -apple-system, sans-serif, 'Arial Black'" 
          font-size="31" 
          font-weight="900" 
          letter-spacing="5" 
          fill="#ffffff" 
          text-anchor="middle">PREVENCIÓN</text>
  </g>

  <!-- Text: NOCTURNO -->
  <g filter="url(#shadow)">
    <rect x="96" y="446" width="320" height="42" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2" opacity="0.95"/>
    <text x="256" y="475" 
          font-family="system-ui, -apple-system, sans-serif, 'Arial Black'" 
          font-size="24" 
          font-weight="900" 
          letter-spacing="6" 
          fill="#facc15" 
          text-anchor="middle">NOCTURNO</text>
  </g>
</svg>`;

// Maskable version with safe padding (80% central zone) for Android
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="nightBgM" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#050814"/>
      <stop offset="50%" stop-color="#0a1226"/>
      <stop offset="100%" stop-color="#111c38"/>
    </linearGradient>

    <linearGradient id="goldGradM" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <linearGradient id="shieldGradM" x1="256" y1="80" x2="256" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>

    <filter id="shadowM" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Full-Bleed Background for Android Maskable -->
  <rect width="512" height="512" fill="url(#nightBgM)"/>
  
  <!-- Content Scaled into 80% Safe Zone (Central 410px) -->
  <g transform="translate(41, 35) scale(0.84)">
    <!-- Crescent Moon -->
    <path d="M210 65 C140 85 90 150 90 228 C90 320 165 395 258 395 C286 395 312 388 335 375 C240 375 165 300 165 205 C165 140 200 85 252 65 C238 63 224 63 210 65 Z" 
          fill="url(#goldGradM)" opacity="0.95" filter="url(#shadowM)"/>

    <!-- Outer Shield Frame -->
    <path d="M256 95 C335 95 365 115 365 185 C365 280 256 360 256 360 C256 360 147 280 147 185 C147 115 177 95 256 95 Z" 
          fill="#0a1329" stroke="url(#goldGradM)" stroke-width="7" filter="url(#shadowM)"/>

    <!-- Inner Safety Shield Body -->
    <path d="M256 110 C322 110 348 126 348 185 C348 266 256 338 256 338 C256 338 164 266 164 185 C164 126 190 110 256 110 Z" 
          fill="url(#shieldGradM)"/>

    <!-- White Safety Cross -->
    <g filter="url(#shadowM)">
      <rect x="238" y="155" width="36" height="105" rx="8" fill="#ffffff"/>
      <rect x="204" y="189.5" width="104" height="36" rx="8" fill="#ffffff"/>
    </g>

    <!-- Radar Eye Core -->
    <circle cx="256" cy="207.5" r="9" fill="#047857"/>
    <circle cx="256" cy="207.5" r="4.5" fill="#facc15"/>

    <!-- PREVENCIÓN Text Box -->
    <g filter="url(#shadowM)">
      <rect x="56" y="388" width="400" height="48" rx="14" fill="#0a1226" stroke="#f59e0b" stroke-width="2.5"/>
      <text x="256" y="421" 
            font-family="system-ui, -apple-system, sans-serif, 'Arial Black'" 
            font-size="31" 
            font-weight="900" 
            letter-spacing="5" 
            fill="#ffffff" 
            text-anchor="middle">PREVENCIÓN</text>
    </g>

    <!-- NOCTURNO Text Box -->
    <g filter="url(#shadowM)">
      <rect x="96" y="444" width="320" height="42" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="256" y="473" 
            font-family="system-ui, -apple-system, sans-serif, 'Arial Black'" 
            font-size="24" 
            font-weight="900" 
            letter-spacing="6" 
            fill="#facc15" 
            text-anchor="middle">NOCTURNO</text>
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');

  // Save standard SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg, 'utf-8');

  // Generate 512x512 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Generate 192x192 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // Generate Maskable 512x512 PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Generate Apple Touch Icon 180x180 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Also update dist/ if it exists so dev and build are immediately updated
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'icon.svg'), standardSvg, 'utf-8');
    await sharp(Buffer.from(standardSvg)).resize(512, 512).png().toFile(path.join(distDir, 'pwa-512x512.png'));
    await sharp(Buffer.from(standardSvg)).resize(192, 192).png().toFile(path.join(distDir, 'pwa-192x192.png'));
    await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(distDir, 'pwa-maskable-512x512.png'));
    await sharp(Buffer.from(standardSvg)).resize(180, 180).png().toFile(path.join(distDir, 'apple-touch-icon.png'));
  }

  console.log('PREVENCIÓN NOCTURNO icons generated successfully with sharp!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
