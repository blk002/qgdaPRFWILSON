const fs = require('fs');

let content = fs.readFileSync('src/pages/Ciclo.jsx', 'utf8');

// Normalize line endings to LF for clean matching
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

if (!content.includes('futureScheduleRules')) {
  content = content.replace(
    'scheduleExtensions\n  } = useStore();',
    'scheduleExtensions,\n    futureScheduleRules\n  } = useStore();'
  );
}

const target = `if (calendarOverrides && calendarOverrides[dateInfo.fullDateStr]) {
                daySubjects = [...calendarOverrides[dateInfo.fullDateStr]];
              }`;

const replacement = `if (calendarOverrides && calendarOverrides[dateInfo.fullDateStr]) {
                daySubjects = [...calendarOverrides[dateInfo.fullDateStr]];
              } else {
                const parts = String(dateInfo.fullDateStr).split('-').map(Number);
                const dayDateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
                const dayOfWeek = dayDateObj.getDay();
                const matchingRules = (futureScheduleRules || [])
                  .filter(r => r.fromDate <= dateInfo.fullDateStr && (r.dayOfWeek === dayOfWeek || r.cycleIndex === dayIndex))
                  .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

                if (matchingRules.length > 0) {
                  daySubjects = [...matchingRules[0].daySlots];
                }
              }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Target replaced in Ciclo.jsx');
} else {
  console.log('Target not found in Ciclo.jsx');
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/pages/Ciclo.jsx', content, 'utf8');
console.log('Ciclo.jsx written!');
