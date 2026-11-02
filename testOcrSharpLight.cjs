const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing light image with sharp...');
  
  // Test A: 4x raw upscale (sometimes 4x is much better than 3x for tiny fonts)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 5000, kernel: 'lanczos3' })
    .toFile('processed_testA.png');

  // Test B: 3x upscale + threshold (binarization) at 128 (turns image into pure black and white, great for OCR)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 3840, kernel: 'lanczos3' })
    .threshold(160) // Binarize
    .toFile('processed_testB.png');

  // Test C: 3x upscale + moderate contrast (gain 1.3) + grayscale
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 3840, kernel: 'lanczos3' })
    .grayscale()
    .linear(1.3, -(128 * 1.3) + 128)
    .toFile('processed_testC.png');

  const worker = await createWorker('por');

  console.log(`Running Test A...`);
  const { data: { text: textA } } = await worker.recognize(`processed_testA.png`);
  fs.writeFileSync(`ocr_result_testA.txt`, textA);

  console.log(`Running Test B...`);
  const { data: { text: textB } } = await worker.recognize(`processed_testB.png`);
  fs.writeFileSync(`ocr_result_testB.txt`, textB);

  console.log(`Running Test C...`);
  const { data: { text: textC } } = await worker.recognize(`processed_testC.png`);
  fs.writeFileSync(`ocr_result_testC.txt`, textC);

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
