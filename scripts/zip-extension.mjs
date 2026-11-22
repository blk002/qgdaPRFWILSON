import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const extDir = resolve(rootDir, 'extensao PC');
const srcDir = resolve(rootDir, 'extensao-src');
const buildScriptPath = resolve(rootDir, 'scripts', 'build-extension.mjs');
const manifestPath = resolve(extDir, 'manifest.json');
const releasesDir = resolve(rootDir, 'releases');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '0.0.0';
const zipName = `qg-prf-rastreador-caveira-v${version}.zip`;
const outZipPath = resolve(releasesDir, zipName);
const stageDir = resolve(releasesDir, `.stage-v${version}`);

if (!existsSync(releasesDir)) {
  mkdirSync(releasesDir, { recursive: true });
}
if (existsSync(outZipPath)) {
  rmSync(outZipPath, { force: true });
}
if (existsSync(stageDir)) {
  rmSync(stageDir, { recursive: true, force: true });
}

try {
  mkdirSync(stageDir, { recursive: true });
  // Copia toda a extensão pronta (manifest.json, bundles, icons/, CONTRATO.md, README.md, resolver) na raiz do ZIP
  cpSync(extDir, stageDir, { recursive: true });
  // Inclui código-fonte modular e script de build
  if (existsSync(srcDir)) {
    cpSync(srcDir, resolve(stageDir, 'extensao-src'), { recursive: true });
  }
  if (existsSync(buildScriptPath)) {
    mkdirSync(resolve(stageDir, 'scripts'), { recursive: true });
    cpSync(buildScriptPath, resolve(stageDir, 'scripts', 'build-extension.mjs'));
  }

  if (process.platform === 'win32') {
    const escapedStage = stageDir.replace(/'/g, "''");
    const escapedDest = outZipPath.replace(/'/g, "''");
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${escapedStage}\\*' -DestinationPath '${escapedDest}' -Force`
      ],
      { stdio: 'inherit' }
    );
  } else {
    execFileSync('zip', ['-r', outZipPath, '.'], { cwd: stageDir, stdio: 'inherit' });
  }
} finally {
  if (existsSync(stageDir)) {
    rmSync(stageDir, { recursive: true, force: true });
  }
}

console.log(`✅ Extensão v${version} empacotada (com extensao-src/) em: ${outZipPath}`);
