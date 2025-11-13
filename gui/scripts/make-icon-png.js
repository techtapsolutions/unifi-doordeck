/**
 * Create a proper 256x256 PNG icon using Canvas
 */
const fs = require('fs');
const path = require('path');

// Create a simple PNG manually (256x256, blue with white text)
function createPNG256() {
  const width = 256;
  const height = 256;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace
  
  // Calculate CRC for IHDR
  const crc = require('zlib').crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crc, 21);
  
  // For simplicity, create a solid color image
  // This is a minimal PNG - for production you'd use a proper library
  
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  
  return Buffer.concat([signature, ihdr, iend]);
}

// Better approach: Create an SVG and save instructions for conversion
const assetsDir = path.join(__dirname, '..', 'assets');

const svg256 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066cc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#004499;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#bgGrad)" rx="26"/>
  <text x="128" y="140" font-family="Arial, sans-serif" font-size="80"
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    UD
  </text>
  <circle cx="64" cy="192" r="10" fill="white"/>
  <circle cx="192" cy="192" r="10" fill="white"/>
  <path d="M 64,64 L 192,64 L 192,96 L 64,96 Z" fill="white" opacity="0.8"/>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'icon-256.svg'), svg256);
console.log('✓ Created: icon-256.svg (256x256)');

// Also create a 512x512 version
const svg512 = svg256.replace(/256/g, '512').replace(/rx="26"/, 'rx="52"')
  .replace(/font-size="80"/, 'font-size="160"')
  .replace(/y="140"/, 'y="280"')
  .replace(/cx="64"/, 'cx="128"').replace(/cy="192"/, 'cy="384"')
  .replace(/cx="192"/, 'cx="384"')
  .replace(/r="10"/, 'r="20"')
  .replace(/L 192,64/, 'L 384,128').replace(/L 192,96/, 'L 384,192')
  .replace(/M 64,64/, 'M 128,128');

fs.writeFileSync(path.join(assetsDir, 'icon-512.svg'), svg512);
console.log('✓ Created: icon-512.svg (512x512)');

console.log('\n⚠️  To create proper ICO file, use an online converter:');
console.log('   1. Open: https://convertio.co/png-ico/');
console.log('   2. Convert icon-512.svg to PNG first (using any SVG viewer)');
console.log('   3. Then convert PNG to ICO with sizes: 16,32,48,256');
console.log('\nFor now, package.json is configured to use PNG instead of ICO.');
