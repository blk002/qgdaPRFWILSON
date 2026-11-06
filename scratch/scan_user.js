const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/wilso/.gemini/antigravity/brain/97644bd2-51d5-44db-b667-f2034569cc86/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let lineIndex = 0;
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.source === 'USER_EXPLICIT' || (obj.content && obj.content.includes('<talker_agent_context>'))) {
      console.log('=== Step ' + lineIndex + ' ===');
      if (obj.content.includes('<talker_agent_context>')) {
        const regex = /user:\s*"([^"]+)"/g;
        let m;
        while ((m = regex.exec(obj.content)) !== null) {
          console.log('  [User Voice]: ' + m[1]);
        }
      } else {
        console.log('  [User Text]: ' + obj.content.trim().substring(0, 300));
      }
    }
  } catch(e){}
  lineIndex++;
});
