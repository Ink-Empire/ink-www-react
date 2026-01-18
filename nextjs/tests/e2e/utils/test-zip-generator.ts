import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Test ZIP Generator
 * Creates ZIP files with dummy images for testing bulk upload performance
 */

interface GenerateOptions {
  imageCount: number;
  imageSize?: 'small' | 'medium' | 'large';
  outputPath?: string;
}

// Image dimensions by size
const IMAGE_SIZES = {
  small: { width: 200, height: 200 },    // ~5KB each
  medium: { width: 800, height: 800 },   // ~50KB each
  large: { width: 1920, height: 1920 },  // ~200KB each
};

/**
 * Generate a simple PNG image using pure Node.js (no external deps)
 * Creates a colored rectangle with some variation
 */
function generateSimplePNG(width: number, height: number, index: number): Buffer {
  // PNG file structure
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);   // bit depth
  ihdrData.writeUInt8(2, 9);   // color type (RGB)
  ihdrData.writeUInt8(0, 10);  // compression
  ihdrData.writeUInt8(0, 11);  // filter
  ihdrData.writeUInt8(0, 12);  // interlace

  const ihdrChunk = createPNGChunk('IHDR', ihdrData);

  // Generate image data with color variation based on index
  const hue = (index * 37) % 360; // Spread colors
  const rgb = hslToRgb(hue / 360, 0.7, 0.5);

  // Create raw image data (filter byte + RGB for each pixel per row)
  const rawData: number[] = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter byte (none)
    for (let x = 0; x < width; x++) {
      // Add some pattern variation
      const shade = ((x + y) % 20 < 10) ? 1.0 : 0.9;
      rawData.push(Math.floor(rgb[0] * shade));
      rawData.push(Math.floor(rgb[1] * shade));
      rawData.push(Math.floor(rgb[2] * shade));
    }
  }

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 6 });

  const idatChunk = createPNGChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createPNGChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createPNGChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation for PNG
function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  const table = getCRC32Table();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crc32Table: number[] | null = null;
function getCRC32Table(): number[] {
  if (crc32Table) return crc32Table;

  crc32Table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c >>> 0;
  }
  return crc32Table;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Generate a test ZIP file with the specified number of images
 */
export async function generateTestZip(options: GenerateOptions): Promise<string> {
  const { imageCount, imageSize = 'small', outputPath } = options;
  const { width, height } = IMAGE_SIZES[imageSize];

  // Create temp directory for images
  const tempDir = path.join(process.cwd(), 'tests', 'temp', `test-images-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`Generating ${imageCount} test images (${imageSize}: ${width}x${height})...`);

  // Generate images
  for (let i = 0; i < imageCount; i++) {
    const imageBuffer = generateSimplePNG(width, height, i);
    const imagePath = path.join(tempDir, `test-image-${String(i + 1).padStart(4, '0')}.png`);
    fs.writeFileSync(imagePath, imageBuffer);

    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${imageCount} images...`);
    }
  }

  // Create ZIP file
  const zipPath = outputPath || path.join(process.cwd(), 'tests', 'temp', `test-upload-${imageCount}-${imageSize}-${Date.now()}.zip`);
  const zipDir = path.dirname(zipPath);
  fs.mkdirSync(zipDir, { recursive: true });

  console.log(`Creating ZIP file at ${zipPath}...`);

  // Use system zip command (cross-platform alternative would need archiver package)
  try {
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" .`, { stdio: 'pipe' });
  } catch (error) {
    // Fallback: try using tar for systems without zip
    console.log('zip command not found, trying alternative...');
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });
  }

  // Cleanup temp images
  fs.rmSync(tempDir, { recursive: true, force: true });

  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`Created ZIP: ${zipPath} (${sizeMB} MB)`);

  return zipPath;
}

/**
 * Clean up test ZIP files
 */
export function cleanupTestFiles(): void {
  const tempDir = path.join(process.cwd(), 'tests', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Cleaned up test files');
  }
}

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const imageCount = parseInt(args[0]) || 100;
  const imageSize = (args[1] as 'small' | 'medium' | 'large') || 'small';

  generateTestZip({ imageCount, imageSize })
    .then((zipPath) => {
      console.log(`\nTest ZIP ready: ${zipPath}`);
    })
    .catch((error) => {
      console.error('Failed to generate test ZIP:', error);
      process.exit(1);
    });
}
