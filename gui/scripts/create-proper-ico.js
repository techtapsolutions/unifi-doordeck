const fs = require('fs');
const path = require('path');

// Create a proper ICO file with 256x256 image
// ICO format supports multiple sizes, we'll create one with 256x256

function createProperICO() {
  const size = 256;
  const bpp = 32; // bits per pixel (RGBA)
  const bytesPerPixel = 4;
  
  // ICO file header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved (must be 0)
  header.writeUInt16LE(1, 2);     // Image type (1 = ICO)
  header.writeUInt16LE(1, 4);     // Number of images
  
  // Image directory entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0);      // Width (0 = 256)
  dirEntry.writeUInt8(0, 1);      // Height (0 = 256)
  dirEntry.writeUInt8(0, 2);      // Color count (0 for true color)
  dirEntry.writeUInt8(0, 3);      // Reserved
  dirEntry.writeUInt16LE(1, 4);   // Color planes
  dirEntry.writeUInt16LE(bpp, 6); // Bits per pixel
  
  // Calculate image data size
  const headerSize = 40; // BITMAPINFOHEADER size
  const imageDataSize = size * size * bytesPerPixel;
  const maskDataSize = Math.ceil(size * size / 8); // 1-bit AND mask
  const totalImageSize = headerSize + imageDataSize + maskDataSize;
  
  dirEntry.writeUInt32LE(totalImageSize, 8);  // Size of image data
  dirEntry.writeUInt32LE(22, 12);             // Offset to image data
  
  // BITMAPINFOHEADER (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);              // Header size
  bmpHeader.writeInt32LE(size, 4);             // Width
  bmpHeader.writeInt32LE(size * 2, 8);         // Height (doubled for XOR + AND masks)
  bmpHeader.writeUInt16LE(1, 12);              // Planes
  bmpHeader.writeUInt16LE(bpp, 14);            // Bits per pixel
  bmpHeader.writeUInt32LE(0, 16);              // Compression (0 = none)
  bmpHeader.writeUInt32LE(imageDataSize, 20);  // Image size
  
  // Create pixel data (blue gradient with white text area)
  const pixels = Buffer.alloc(imageDataSize);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * bytesPerPixel;
      
      // Create a blue gradient background
      const blue = 204 - Math.floor((y / size) * 50);
      const green = 102 - Math.floor((y / size) * 30);
      const red = 0;
      
      // Simple "UD" text area (white rectangle in middle)
      const isTextArea = (x > size * 0.3 && x < size * 0.7 && 
                          y > size * 0.35 && y < size * 0.65);
      
      if (isTextArea) {
        pixels[offset] = 255;     // Blue
        pixels[offset + 1] = 255; // Green  
        pixels[offset + 2] = 255; // Red
      } else {
        pixels[offset] = blue;     // Blue
        pixels[offset + 1] = green; // Green
        pixels[offset + 2] = red;   // Red
      }
      pixels[offset + 3] = 255;  // Alpha (fully opaque)
    }
  }
  
  // Create AND mask (all zeros = all visible)
  const mask = Buffer.alloc(maskDataSize, 0);
  
  // Combine all parts
  const ico = Buffer.concat([header, dirEntry, bmpHeader, pixels, mask]);
  
  return ico;
}

// Create the ICO file
const assetsDir = path.join(__dirname, '..', 'assets');
const icoPath = path.join(assetsDir, 'icon.ico');

try {
  const icoData = createProperICO();
  fs.writeFileSync(icoPath, icoData);
  console.log(`✓ Created proper ICO file: ${icoPath}`);
  console.log(`  Size: ${icoData.length} bytes`);
  console.log(`  Resolution: 256x256 pixels, 32-bit color`);
} catch (error) {
  console.error('✗ Error creating ICO file:', error.message);
  process.exit(1);
}
