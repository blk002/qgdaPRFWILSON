const sharp = require('sharp');
const path = require('path');

async function splitBadges() {
  const inputPath = path.join(__dirname, 'public', 'assets', 'gamification', 'patentes_sheet.jpg');
  const outputDir = path.join(__dirname, 'public', 'assets', 'gamification');

  const meta = await sharp(inputPath).metadata();
  const W = meta.width;  // 2048
  const H = meta.height; // 2048
  console.log(`Image size: ${W}x${H}`);

  const splitY = Math.floor(H * 0.50); // middle

  const badges = [
    // Top row: 3 equal columns
    { name: 'rank_1_recruta',  left: 0,                 top: 0,      width: Math.floor(W/3),       height: splitY },
    { name: 'rank_2_agente3',  left: Math.floor(W/3),   top: 0,      width: Math.floor(W/3),       height: splitY },
    { name: 'rank_3_agente2',  left: Math.floor(2*W/3), top: 0,      width: W - Math.floor(2*W/3), height: splitY },
    // Bottom row: 4 equal columns
    { name: 'rank_4_agente1',  left: 0,                 top: splitY, width: Math.floor(W/4),       height: H - splitY },
    { name: 'rank_5_especial', left: Math.floor(W/4),   top: splitY, width: Math.floor(W/4),       height: H - splitY },
    { name: 'rank_6_inspetor', left: Math.floor(2*W/4), top: splitY, width: Math.floor(W/4),       height: H - splitY },
    { name: 'rank_7_lenda',    left: Math.floor(3*W/4), top: splitY, width: W - Math.floor(3*W/4), height: H - splitY },
  ];

  for (const badge of badges) {
    const outputPath = path.join(outputDir, `${badge.name}.png`);
    
    await sharp(inputPath)
      .extract({ left: badge.left, top: badge.top, width: badge.width, height: badge.height })
      .resize(256, 256, { 
        fit: 'contain', 
        background: { r: 15, g: 23, b: 42, alpha: 255 } // slate-900 bg to match
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ ${badge.name}.png`);
  }
  
  console.log('\n🎖️ Done!');
}

splitBadges().catch(console.error);
