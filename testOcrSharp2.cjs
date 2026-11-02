const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing image with sharp...');
  
  // Test 4: Upscale 4x (width 4000px)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .toFile('processed_test4.png');

  // Test 5: Upscale 4x + Sharpen
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .sharpen({ sigma: 1.5, m1: 0.5, m2: 2.0 }) // Moderate sharpen to define text edges
    .toFile('processed_test5.png');

  const worker = await createWorker('por');

  for (let i = 4; i <= 5; i++) {
    console.log(`Running OCR on Test ${i}...`);
    const { data: { text } } = await worker.recognize(`processed_test${i}.png`);
    fs.writeFileSync(`ocr_result_test${i}.txt`, text);
    console.log(`Test ${i} finished.`);
  }

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
