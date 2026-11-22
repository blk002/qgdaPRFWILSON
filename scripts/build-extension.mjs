import * as esbuild from 'esbuild';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const srcDir = resolve(rootDir, 'extensao-src', 'entries');
const outDir = resolve(rootDir, 'extensao PC');

const ENTRIES = [
  { in: 'content.entry.js', out: 'content.js', extra: { loader: { '.css': 'text' } } },
  { in: 'background.entry.js', out: 'background.js' },
  { in: 'popup.entry.js', out: 'popup.js' },
  { in: 'qg_bridge.entry.js', out: 'qg_bridge.js' },
  { in: 'player_bridge.entry.js', out: 'player_bridge.js' },
  { in: 'api_sniffer.entry.js', out: 'api_sniffer.js' },
];

async function run() {
  const manifestPath = resolve(outDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json não encontrado em ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  for (const entry of ENTRIES) {
    const entryPath = resolve(srcDir, entry.in);
    const outPath = resolve(outDir, entry.out);
    if (!existsSync(entryPath)) {
      throw new Error(`Entrypoint ausente: ${entryPath}`);
    }

    await esbuild.build({
      entryPoints: [entryPath],
      outfile: outPath,
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['chrome116'],
      charset: 'utf8',
      minify: false,
      legalComments: 'none',
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'globalThis',
      },
      ...(entry.extra || {}),
    });

    const kb = (statSync(outPath).size / 1024).toFixed(1);
    console.log(`✅ [extensao build] ${entry.out} (${kb} KB)`);
  }

  console.log(`🎉 Extensão v${manifest.version} compilada com sucesso.`);
}

run().catch((err) => {
  console.error('❌ Falha ao compilar extensão:', err);
  process.exit(1);
});
