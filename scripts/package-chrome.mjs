import { execSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const outDir = resolve(root, 'dist-chrome');

mkdirSync(outDir, { recursive: true });

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const zipName = `highlight-sync-chrome-v${pkg.version}.zip`;
execSync(`cd "${distDir}" && zip -r "${resolve(outDir, zipName)}" .`, { stdio: 'inherit' });

console.log(`✅ Chrome package created: dist-chrome/${zipName}`);
