const fs = require('fs');
const path = require('path');

// 1. UPDATE useStore.js
let storeContent = fs.readFileSync('src/store/useStore.js', 'utf8');
const isCRLF = storeContent.includes('\r\n');
storeContent = storeContent.replace(/\r\n/g, '\n');

const oldLoopCode = `            allDone = Object.keys(remainingLessonsQueue).every(subId => 
              remainingLessonsQueue[subId].length === 0 || (!subjectsInCycle.has(subId) && !Object.values(subjects).some(s => s.replacementSubjectId === subId))
            );
            if (!allDone) dayOffset++;`;

const newLoopCode = `            if (progressMadeToday) {
              consecutiveNoProgressDays = 0;
            } else {
              consecutiveNoProgressDays++;
            }

            const anyRemainingInQueues = Object.keys(remainingLessonsQueue).some(subId => remainingLessonsQueue[subId].length > 0);
            if (!anyRemainingInQueues || consecutiveNoProgressDays >= 60) {
              allDone = true;
            } else {
              dayOffset++;
            }`;

if (storeContent.includes(oldLoopCode)) {
  storeContent = storeContent.replace(oldLoopCode, newLoopCode);
  console.log('Replaced loop condition in useStore.js');
} else {
  console.log('oldLoopCode not matched directly in useStore.js');
}

// Add progressMadeToday and consecutiveNoProgressDays
if (!storeContent.includes('let consecutiveNoProgressDays = 0;')) {
  storeContent = storeContent.replace(
    'const maxSimulationDays = 1500;',
    'const maxSimulationDays = 1500;\n        let consecutiveNoProgressDays = 0;'
  );
  storeContent = storeContent.replace(
    'daySubjects.forEach((subId, slotIdx) => {',
    'let progressMadeToday = false;\n            daySubjects.forEach((subId, slotIdx) => {'
  );
  storeContent = storeContent.replace(
    'q.shift();\n                    if (goalMin === 0) break;',
    'q.shift();\n                    progressMadeToday = true;\n                    if (goalMin === 0) break;'
  );
  storeContent = storeContent.replace(
    'slotAccelMins += nextLesson.accelMins;\n                    q.shift();\n                  } else {',
    'slotAccelMins += nextLesson.accelMins;\n                    q.shift();\n                    progressMadeToday = true;\n                  } else {'
  );
  console.log('Added progressMadeToday tracking in useStore.js');
}

if (isCRLF) {
  storeContent = storeContent.replace(/\n/g, '\r\n');
}
fs.writeFileSync('src/store/useStore.js', storeContent, 'utf8');
console.log('useStore.js updated!');
