const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing image with sharp...');
  
  // Test 7: Upscale 4x + Grayscale + High Contrast
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .grayscale()
    .linear(2.0, -100)
    .toFile('processed_test7.png');

  // Test 8: Upscale 4x + Grayscale (No Contrast)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .grayscale()
    .toFile('processed_test8.png');

  const worker = await createWorker('por');

  for (let i = 7; i <= 8; i++) {
    console.log(`Running OCR on Test ${i}...`);
    const { data: { text } } = await worker.recognize(`processed_test${i}.png`);
    fs.writeFileSync(`ocr_result_test${i}.txt`, text);
    console.log(`Test ${i} finished.`);
  }

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
