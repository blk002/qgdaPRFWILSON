const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing image with sharp...');
  
  // Test 9: Upscale 4x + Grayscale + moderate contrast (gain 1.5, bias -30)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .grayscale()
    .linear(1.4, -40)
    .toFile('processed_test9.png');

  // Test 10: Upscale 4x + Color (No Grayscale) + moderate contrast (linear 1.4, -40)
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png')
    .resize({ width: 4000, kernel: 'lanczos3' })
    .linear(1.4, -40)
    .toFile('processed_test10.png');

  const worker = await createWorker('por');

  for (let i = 9; i <= 10; i++) {
    console.log(`Running OCR on Test ${i}...`);
    const { data: { text } } = await worker.recognize(`processed_test${i}.png`);
    fs.writeFileSync(`ocr_result_test${i}.txt`, text);
    console.log(`Test ${i} finished.`);
  }

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
