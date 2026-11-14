import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const extDir = resolve(rootDir, 'extensao PC');
const manifestPath = resolve(extDir, 'manifest.json');
const releasesDir = resolve(rootDir, 'releases');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '0.0.0';
const zipName = `qg-prf-rastreador-caveira-v${version}.zip`;
const outZipPath = resolve(releasesDir, zipName);

if (!existsSync(releasesDir)) {
  mkdirSync(releasesDir, { recursive: true });
}
if (existsSync(outZipPath)) {
  rmSync(outZipPath);
}

if (process.platform === 'win32') {
  const escapedSource = extDir.replace(/'/g, "''");
  const escapedDest = outZipPath.replace(/'/g, "''");
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${escapedSource}\\*' -DestinationPath '${escapedDest}' -Force`
    ],
    { stdio: 'inherit' }
  );
} else {
  execFileSync('zip', ['-r', outZipPath, '.'], { cwd: extDir, stdio: 'inherit' });
}

console.log(`✅ Extensão empacotada em: ${outZipPath}`);
