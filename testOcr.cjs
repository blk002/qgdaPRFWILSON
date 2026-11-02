const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function testOcr() {
  const worker = await createWorker('por');
  const result = await worker.recognize('C:\\Users\\wilso\\.gemini\\antigravity\\brain\\93d0c9b9-0a58-4975-bbab-cb0b189fe4d1\\media__1783280966599.png');
  fs.writeFileSync('ocr_result.txt', result.data.text);
  console.log('OCR concluído.');
  await worker.terminate();
}

testOcr();
