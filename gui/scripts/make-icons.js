/**
 * Make Icons Script
 * Creates placeholder icon files for the application
 *
 * For production, replace these with professionally designed icons
 */

const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

// Professional SVG icon generator
function generateMainIcon(size) {
  const scale = size / 512;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066cc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0052a3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="doorGradient${size}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e6e6e6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bgGradient${size})" rx="${80 * scale}"/>
  <rect x="${80 * scale}" y="${120 * scale}" width="${140 * scale}" height="${280 * scale}" fill="url(#doorGradient${size})" rx="${8 * scale}" stroke="#b3b3b3" stroke-width="${4 * scale}"/>
  <circle cx="${195 * scale}" cy="${260 * scale}" r="${12 * scale}" fill="#0066cc"/>
  <rect x="${95 * scale}" y="${140 * scale}" width="${110 * scale}" height="${110 * scale}" fill="none" stroke="#d9d9d9" stroke-width="${3 * scale}" rx="${4 * scale}"/>
  <rect x="${95 * scale}" y="${270 * scale}" width="${110 * scale}" height="${110 * scale}" fill="none" stroke="#d9d9d9" stroke-width="${3 * scale}" rx="${4 * scale}"/>
  <path d="M ${230 * scale} ${200 * scale} L ${280 * scale} ${200 * scale}" stroke="#FFD700" stroke-width="${8 * scale}" stroke-linecap="round"/>
  <path d="M ${270 * scale} ${190 * scale} L ${285 * scale} ${200 * scale} L ${270 * scale} ${210 * scale}" fill="#FFD700" stroke="none"/>
  <path d="M ${230 * scale} ${260 * scale} L ${280 * scale} ${260 * scale}" stroke="#FFD700" stroke-width="${8 * scale}" stroke-linecap="round"/>
  <path d="M ${270 * scale} ${250 * scale} L ${285 * scale} ${260 * scale} L ${270 * scale} ${270 * scale}" fill="#FFD700" stroke="none"/>
  <path d="M ${280 * scale} ${320 * scale} L ${230 * scale} ${320 * scale}" stroke="#4CAF50" stroke-width="${8 * scale}" stroke-linecap="round"/>
  <path d="M ${240 * scale} ${310 * scale} L ${225 * scale} ${320 * scale} L ${240 * scale} ${330 * scale}" fill="#4CAF50" stroke="none"/>
  <rect x="${292 * scale}" y="${120 * scale}" width="${140 * scale}" height="${280 * scale}" fill="url(#doorGradient${size})" rx="${8 * scale}" stroke="#b3b3b3" stroke-width="${4 * scale}"/>
  <circle cx="${307 * scale}" cy="${260 * scale}" r="${12 * scale}" fill="#4CAF50"/>
  <rect x="${307 * scale}" y="${140 * scale}" width="${110 * scale}" height="${110 * scale}" fill="none" stroke="#d9d9d9" stroke-width="${3 * scale}" rx="${4 * scale}"/>
  <rect x="${307 * scale}" y="${270 * scale}" width="${110 * scale}" height="${110 * scale}" fill="none" stroke="#d9d9d9" stroke-width="${3 * scale}" rx="${4 * scale}"/>
  <circle cx="${362 * scale}" cy="${180 * scale}" r="${24 * scale}" fill="#4CAF50" opacity="0.9"/>
  <path d="M ${362 * scale} ${172 * scale} L ${362 * scale} ${176 * scale}" stroke="white" stroke-width="${2 * scale}" stroke-linecap="round"/>
  <rect x="${354 * scale}" y="${176 * scale}" width="${16 * scale}" height="${12 * scale}" fill="white" rx="${2 * scale}"/>
  <circle cx="${362 * scale}" cy="${182 * scale}" r="${2 * scale}" fill="#4CAF50"/>
  <circle cx="${256 * scale}" cy="${430 * scale}" r="${18 * scale}" fill="#4CAF50" opacity="0.8"/>
  <path d="M ${248 * scale} ${430 * scale} L ${254 * scale} ${436 * scale} L ${264 * scale} ${424 * scale}" stroke="white" stroke-width="${3 * scale}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

// Tray icon generator (simple, small size)
function generateTrayIcon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="11" height="20" fill="#ffffff" rx="1" stroke="#333333" stroke-width="1"/>
  <circle cx="11" cy="16" r="1.5" fill="#0066cc"/>
  <path d="M 14 16 L 18 16" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
  <path d="M 17 14 L 19 16 L 17 18" fill="#FFD700" stroke="none"/>
  <rect x="19" y="6" width="11" height="20" fill="#ffffff" rx="1" stroke="#333333" stroke-width="1"/>
  <circle cx="21" cy="16" r="1.5" fill="#4CAF50"/>
  <circle cx="25" cy="12" r="3" fill="#4CAF50" opacity="0.9"/>
  <rect x="23.5" y="12" width="3" height="2" fill="white" rx="0.5"/>
  <circle cx="25" cy="13" r="0.5" fill="#4CAF50"/>
</svg>`;
}

// Create ICO file with proper size
function createICOFile(filePath) {
  // Create a proper multi-resolution ICO file
  const sizes = [256]; // electron-builder requires at least 256x256

  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);        // Reserved (must be 0)
  header.writeUInt16LE(1, 2);        // Type (1 = ICO)
  header.writeUInt16LE(sizes.length, 4); // Number of images

  const iconDirEntries = [];
  const imageDataBuffers = [];
  let dataOffset = 6 + (16 * sizes.length); // Header + directory entries

  sizes.forEach(size => {
    // Create a simple 32-bit RGBA BMP image
    const width = size;
    const height = size;
    const bpp = 32; // bits per pixel
    const rowSize = Math.floor((bpp * width + 31) / 32) * 4; // Row size must be multiple of 4
    const pixelDataSize = rowSize * height;
    const maskDataSize = Math.floor((width + 31) / 32) * 4 * height; // AND mask

    // BMP Info Header (40 bytes)
    const bmpInfoHeader = Buffer.alloc(40);
    bmpInfoHeader.writeUInt32LE(40, 0);           // Header size
    bmpInfoHeader.writeInt32LE(width, 4);         // Width
    bmpInfoHeader.writeInt32LE(height * 2, 8);    // Height * 2 (includes AND mask)
    bmpInfoHeader.writeUInt16LE(1, 12);           // Planes
    bmpInfoHeader.writeUInt16LE(bpp, 14);         // Bits per pixel
    bmpInfoHeader.writeUInt32LE(0, 16);           // Compression (0 = none)
    bmpInfoHeader.writeUInt32LE(pixelDataSize, 20); // Image size
    bmpInfoHeader.writeInt32LE(0, 24);            // X pixels per meter
    bmpInfoHeader.writeInt32LE(0, 28);            // Y pixels per meter
    bmpInfoHeader.writeUInt32LE(0, 32);           // Colors used
    bmpInfoHeader.writeUInt32LE(0, 36);           // Important colors

    // Create pixel data (BGRA format, bottom-up)
    const pixelData = Buffer.alloc(pixelDataSize);

    // Create a simple blue gradient icon with white elements
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * rowSize) + (x * 4);

        // Blue gradient background
        const gradient = Math.floor(204 - (y / height) * 51);
        pixelData[offset] = gradient;     // Blue
        pixelData[offset + 1] = Math.floor(gradient * 0.5); // Green
        pixelData[offset + 2] = 0;        // Red
        pixelData[offset + 3] = 255;      // Alpha (fully opaque)

        // Add white door shapes
        const centerX = width / 2;
        const doorWidth = width * 0.25;
        const doorHeight = height * 0.5;
        const doorTop = height * 0.25;

        // Left door
        if (x >= centerX - doorWidth * 1.5 && x <= centerX - doorWidth * 0.5 &&
            y >= doorTop && y <= doorTop + doorHeight) {
          pixelData[offset] = 255;     // Blue
          pixelData[offset + 1] = 255; // Green
          pixelData[offset + 2] = 255; // Red
        }

        // Right door
        if (x >= centerX + doorWidth * 0.5 && x <= centerX + doorWidth * 1.5 &&
            y >= doorTop && y <= doorTop + doorHeight) {
          pixelData[offset] = 200;     // Blue
          pixelData[offset + 1] = 255; // Green
          pixelData[offset + 2] = 200; // Red
        }
      }
    }

    // Create AND mask (all transparent)
    const maskData = Buffer.alloc(maskDataSize, 0);

    // Combine BMP data
    const imageData = Buffer.concat([bmpInfoHeader, pixelData, maskData]);

    // Icon directory entry (16 bytes)
    const dirEntry = Buffer.alloc(16);
    dirEntry.writeUInt8(size === 256 ? 0 : size, 0); // Width (0 means 256)
    dirEntry.writeUInt8(size === 256 ? 0 : size, 1); // Height (0 means 256)
    dirEntry.writeUInt8(0, 2);                        // Color palette (0 = no palette)
    dirEntry.writeUInt8(0, 3);                        // Reserved
    dirEntry.writeUInt16LE(1, 4);                     // Color planes
    dirEntry.writeUInt16LE(bpp, 6);                   // Bits per pixel
    dirEntry.writeUInt32LE(imageData.length, 8);      // Size of image data
    dirEntry.writeUInt32LE(dataOffset, 12);           // Offset to image data

    iconDirEntries.push(dirEntry);
    imageDataBuffers.push(imageData);
    dataOffset += imageData.length;
  });

  // Combine all parts
  const icoFile = Buffer.concat([
    header,
    ...iconDirEntries,
    ...imageDataBuffers
  ]);

  fs.writeFileSync(filePath, icoFile);
}

// Create BMP file for installer graphics
function createBMPPlaceholder(filePath, width, height) {
  // BMP file header (14 bytes)
  const fileHeader = Buffer.alloc(14);
  fileHeader.write('BM', 0);                    // Signature
  fileHeader.writeUInt32LE(54 + (width * height * 3), 2);  // File size
  fileHeader.writeUInt32LE(54, 10);             // Offset to pixel data

  // DIB header (40 bytes)
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0);               // Header size
  dibHeader.writeInt32LE(width, 4);             // Width
  dibHeader.writeInt32LE(height, 8);            // Height
  dibHeader.writeUInt16LE(1, 12);               // Planes
  dibHeader.writeUInt16LE(24, 14);              // Bits per pixel

  // Pixel data (simple blue background)
  const pixelData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = 204;     // Blue
    pixelData[i + 1] = 102; // Green
    pixelData[i + 2] = 0;   // Red (BGR format)
  }

  const bmpData = Buffer.concat([fileHeader, dibHeader, pixelData]);
  fs.writeFileSync(filePath, bmpData);
}

function main() {
  console.log('\n==========================================');
  console.log('Creating Application Icons');
  console.log('==========================================\n');
  console.log('✨ Generating professional icon designs...\n');

  const rootDir = path.join(__dirname, '..');
  const assetsDir = path.join(rootDir, 'assets');

  ensureDirectoryExists(assetsDir);

  const files = [
    // SVG icons (Electron can load these directly)
    {
      path: path.join(assetsDir, 'icon.svg'),
      content: generateMainIcon(512),
      type: 'svg'
    },
    {
      path: path.join(assetsDir, 'icon-256.svg'),
      content: generateMainIcon(256),
      type: 'svg'
    },
    {
      path: path.join(assetsDir, 'icon-512.svg'),
      content: generateMainIcon(512),
      type: 'svg'
    },
    {
      path: path.join(assetsDir, 'tray-icon.svg'),
      content: generateTrayIcon(),
      type: 'svg'
    },
  ];

  // Create SVG files
  let createdCount = 0;
  files.forEach((file) => {
    try {
      fs.writeFileSync(file.path, file.content);
      console.log(`✓ Created: ${path.basename(file.path)}`);
      createdCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${file.path}:`, error.message);
    }
  });

  // Create ICO file
  try {
    const icoPath = path.join(assetsDir, 'icon.ico');
    createICOFile(icoPath);
    console.log(`✓ Created: icon.ico (256x256)`);
    createdCount++;
  } catch (error) {
    console.error('✗ Failed to create icon.ico:', error.message);
  }

  // Create BMP files for installer
  try {
    const headerPath = path.join(assetsDir, 'installer-header.bmp');
    createBMPPlaceholder(headerPath, 150, 57);
    console.log(`✓ Created: installer-header.bmp (150x57)`);
    createdCount++;
  } catch (error) {
    console.error('✗ Failed to create installer-header.bmp:', error.message);
  }

  try {
    const sidebarPath = path.join(assetsDir, 'installer-sidebar.bmp');
    createBMPPlaceholder(sidebarPath, 164, 314);
    console.log(`✓ Created: installer-sidebar.bmp (164x314)`);
    createdCount++;
  } catch (error) {
    console.error('✗ Failed to create installer-sidebar.bmp:', error.message);
  }

  console.log('\n==========================================');
  console.log(`✓ Created ${createdCount} professional icon files`);
  console.log('==========================================\n');

  console.log('📝 Icon Features:');
  console.log('   ✓ Two-door design representing UniFi-Doordeck bridge');
  console.log('   ✓ Bi-directional arrows showing data flow');
  console.log('   ✓ Lock icon on right door (Doordeck)');
  console.log('   ✓ Status indicator (bottom)');
  console.log('   ✓ Blue gradient background');
  console.log('   ✓ Tray icon optimized for small sizes\n');

  console.log('📁 Generated Files:');
  console.log('   - icon.svg (512x512) - Main application icon');
  console.log('   - icon-256.svg (256x256) - Medium size variant');
  console.log('   - icon-512.svg (512x512) - Large size variant');
  console.log('   - tray-icon.svg (32x32) - System tray icon');
  console.log('   - icon.ico (256x256) - Windows icon');
  console.log('   - installer-*.bmp - Installer graphics\n');
}

main();
