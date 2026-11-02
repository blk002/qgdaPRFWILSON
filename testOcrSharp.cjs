const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log('Processing image with sharp...');
  
  // Test 1: Upscale 3x + grayscale + contrast
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 3840, kernel: 'lanczos3' })
    .grayscale()
    .linear(2.5, -(128 * 2.5) + 128) // High contrast
    .toFile('processed_test1.png');

  // Test 2: Inverted
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 3840, kernel: 'lanczos3' })
    .negate()
    .toFile('processed_test2.png');

  // Test 3: Raw Upscale 3x
  await sharp('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783292724508.png')
    .resize({ width: 3000, kernel: 'lanczos3' })
    .toFile('processed_test3.png');

  const worker = await createWorker('por');

  for (let i = 1; i <= 3; i++) {
    console.log(`Running OCR on Test ${i}...`);
    const { data: { text } } = await worker.recognize(`processed_test${i}.png`);
    fs.writeFileSync(`ocr_result_test${i}.txt`, text);
    console.log(`Test ${i} finished.`);
  }

  await worker.terminate();
  console.log('Done!');
}

test().catch(console.error);
