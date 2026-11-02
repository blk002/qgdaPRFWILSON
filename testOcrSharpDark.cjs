const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing dark image with sharp...');
  
  // Test 11: Upscale 3x, like the browser does
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280304185.png')
    .resize({ width: 3840, kernel: 'lanczos3' }) // roughly 3x
    .toFile('processed_test11.png');

  const worker = await createWorker('por');

  console.log(`Running OCR on Test 11...`);
  const { data: { text } } = await worker.recognize(`processed_test11.png`);
  fs.writeFileSync(`ocr_result_test11.txt`, text);
  console.log(`Test 11 finished.`);

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
