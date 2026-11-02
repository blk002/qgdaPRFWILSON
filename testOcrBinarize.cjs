const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Testing Binarize-then-Upscale...');
  
  // Test D: Binarize at original size, then upscale 3x
  const original = sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png');
  const metadata = await original.metadata();
  
  await original
    .threshold(150) // Binarize at original size
    .resize({ width: metadata.width * 3 }) // Upscale 3x
    .toFile('processed_testD.png');

  const worker = await createWorker('por');

  console.log(`Running Test D...`);
  const { data: { text: textD } } = await worker.recognize(`processed_testD.png`);
  fs.writeFileSync(`ocr_result_testD.txt`, textD);

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
