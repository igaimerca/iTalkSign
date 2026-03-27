import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const datasetPath = join(__dirname, '../DATASET');
const outputPath = join(__dirname, '../src/data/datasetManifest.json');

const manifest = {};
const folders = readdirSync(datasetPath, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const basePath = process.env.VITE_BASE_PATH || '/';

for (const folder of folders) {
  const folderPath = join(datasetPath, folder);
  const files = readdirSync(folderPath).filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));
  if (files.length > 0) {
    manifest[folder] = `${basePath}DATASET/${folder}/${files[0]}`;
  }
}

mkdirSync(join(__dirname, '../src/data'), { recursive: true });
writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Dataset manifest generated:', Object.keys(manifest).length, 'symbols');
