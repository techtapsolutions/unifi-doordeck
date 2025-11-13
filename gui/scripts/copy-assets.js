/**
 * Copy Assets Script
 * Copies necessary assets to the build directories
 */

const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function copyFile(src, dest) {
  try {
    ensureDirectoryExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Could not copy ${src}:`, error.message);
    return false;
  }
}

function main() {
  console.log('\n==========================================');
  console.log('Copying Assets to Build Directory');
  console.log('==========================================\n');

  const rootDir = path.join(__dirname, '..');
  const assetsDir = path.join(rootDir, 'assets');
  const distRendererDir = path.join(rootDir, 'dist-renderer');

  // Ensure assets directory exists
  ensureDirectoryExists(assetsDir);
  ensureDirectoryExists(distRendererDir);

  // List of assets to copy
  const assetsToCopy = [
    {
      src: path.join(assetsDir, 'icon.svg'),
      dest: path.join(distRendererDir, 'icon.svg'),
    },
    {
      src: path.join(assetsDir, 'tray-icon.svg'),
      dest: path.join(distRendererDir, 'tray-icon.svg'),
    },
  ];

  let copiedCount = 0;
  let skippedCount = 0;

  assetsToCopy.forEach((asset) => {
    if (fs.existsSync(asset.src)) {
      if (copyFile(asset.src, asset.dest)) {
        copiedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.warn(`⚠ Asset not found: ${asset.src}`);
      skippedCount++;
    }
  });

  console.log('\n==========================================');
  console.log(`Assets copied: ${copiedCount}`);
  console.log(`Assets skipped: ${skippedCount}`);
  console.log('==========================================\n');

  if (skippedCount > 0) {
    console.log('⚠ Some assets were not found. Run "npm run make-icons" to create placeholder icons.\n');
  }
}

main();
