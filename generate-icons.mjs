import sharp from 'sharp';
import { join } from 'path';

const src = join(process.cwd(), 'public/logo.png');
const dest = (filename) => join(process.cwd(), 'public', filename);

async function generate() {
  try {
    await sharp(src).resize(192, 192).toFile(dest('pwa-192x192.png'));
    await sharp(src).resize(512, 512).toFile(dest('pwa-512x512.png'));
    await sharp(src).resize(512, 512, { fit: 'contain', background: '#FFFFFF' }).toFile(dest('maskable-icon.png'));
    await sharp(src).resize(180, 180).toFile(dest('apple-touch-icon.png'));
    console.log('Icons generated successfully.');
  } catch (error) {
    console.error('Failed to generate icons:', error);
    process.exit(1);
  }
}

generate();
