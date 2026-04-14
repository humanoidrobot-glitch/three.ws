import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '..', 'public', 'pwa-icon.svg');
const outDir = join(__dirname, '..', 'public');
const svg = readFileSync(svgPath);

for (const size of [192, 512]) {
	const outPath = join(outDir, `pwa-${size}x${size}.png`);
	await sharp(svg).resize(size, size).png().toFile(outPath);
	console.log(`Created ${outPath}`);
}
