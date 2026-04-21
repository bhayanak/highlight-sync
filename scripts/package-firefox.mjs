import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const outDir = resolve(root, 'dist-firefox');
const tmpDir = resolve(root, 'dist-firefox-tmp');

// Clean up and create temp working copy so dist/ stays untouched
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(distDir, tmpDir, { recursive: true });

// Read manifest and convert MV3 → Firefox-compatible
const manifestPath = resolve(tmpDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Firefox-specific settings
manifest.browser_specific_settings = {
  gecko: {
    id: 'highlight-sync@extension',
    strict_min_version: '109.0',
    data_collection_permissions: {
      required: ['none'],
    },
  },
};

// Firefox uses background.scripts instead of service_worker
if (manifest.background?.service_worker) {
  manifest.background = {
    scripts: [manifest.background.service_worker],
    type: 'module',
  };
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const xpiName = `highlight-sync-firefox-v${pkg.version}.xpi`;
execSync(`cd "${tmpDir}" && zip -r "${resolve(outDir, xpiName)}" .`, { stdio: 'inherit' });

// Clean up temp directory
rmSync(tmpDir, { recursive: true, force: true });

console.log(`✅ Firefox package created: dist-firefox/${xpiName}`);
