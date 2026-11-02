const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing dark image with sharp...');
  
  // Upscale 3x
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280304185.png')
    .resize({ width: 3840, kernel: 'lanczos3' })
    .toFile('processed_psm.png');

  // Test PSM 11
  const worker11 = await createWorker('por');
  await worker11.setParameters({
    tessedit_pageseg_mode: '11',
  });
  
  console.log(`Running OCR with PSM 11...`);
  const { data: { text: text11 } } = await worker11.recognize(`processed_psm.png`);
  fs.writeFileSync(`ocr_result_psm11.txt`, text11);
  await worker11.terminate();

  // Test PSM 6
  const worker6 = await createWorker('por');
  await worker6.setParameters({
    tessedit_pageseg_mode: '6',
  });
  
  console.log(`Running OCR with PSM 6...`);
  const { data: { text: text6 } } = await worker6.recognize(`processed_psm.png`);
  fs.writeFileSync(`ocr_result_psm6.txt`, text6);
  await worker6.terminate();

  console.log('Done!');
}

test().catch(console.error);
