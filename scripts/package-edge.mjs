import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const outDir = resolve(root, 'dist-edge');
const tmpDir = resolve(root, 'dist-edge-tmp');

// Clean up and create temp working copy so dist/ stays untouched
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(distDir, tmpDir, { recursive: true });

// Read manifest — Edge is Chrome-compatible MV3 but we strip update_url
// per https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension
const manifestPath = resolve(tmpDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Remove update_url if present (required for Edge Add-ons certification)
delete manifest.update_url;

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const zipName = `highlight-sync-edge-v${pkg.version}.zip`;
execSync(`cd "${tmpDir}" && zip -r "${resolve(outDir, zipName)}" .`, { stdio: 'inherit' });

// Clean up temp directory
rmSync(tmpDir, { recursive: true, force: true });

console.log(`✅ Edge package created: dist-edge/${zipName}`);
