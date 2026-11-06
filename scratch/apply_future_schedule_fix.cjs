const fs = require('fs');
const path = require('path');

// 1. Update useStore.js
let storeContent = fs.readFileSync('src/store/useStore.js', 'utf8');

// Add futureScheduleRules to getCleanInitialState
if (!storeContent.includes('futureScheduleRules: []')) {
  storeContent = storeContent.replace(
    'scheduleExtensions: [],',
    'scheduleExtensions: [],\n  futureScheduleRules: [],'
  );
}

// Add to PERSISTED_KEYS
if (!storeContent.includes("'futureScheduleRules'")) {
  storeContent = storeContent.replace(
    "'scheduleExtensions',",
    "'scheduleExtensions', 'futureScheduleRules',"
  );
}

// Add actions
const targetAction = 'removeScheduleExtension: (extId) => set(state => ({';
if (!storeContent.includes('addFutureScheduleRule:')) {
  const newActions = `addFutureScheduleRule: ({ fromDate, dayOfWeek, cycleIndex, daySlots }) => set(state => ({
        futureScheduleRules: [
          ...(state.futureScheduleRules || []).filter(r => !(r.fromDate === fromDate && (r.dayOfWeek === dayOfWeek || r.cycleIndex === cycleIndex))),
          {
            id: 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            fromDate,
            dayOfWeek,
            cycleIndex,
            daySlots: [...daySlots]
          }
        ]
      })),
      removeFutureScheduleRule: (ruleId) => set(state => ({
        futureScheduleRules: (state.futureScheduleRules || []).filter(r => r.id !== ruleId)
      })),
      `;
  storeContent = storeContent.replace(targetAction, newActions + targetAction);
}

// Update getSubjectEstimates destructuring
storeContent = storeContent.replace(
  'calendarOverrides, scheduleExtensions } = get();',
  'calendarOverrides, scheduleExtensions, futureScheduleRules } = get();'
);

// Update getSubjectEstimates simulation loop to respect futureScheduleRules
const loopTarget = `            let daySubjects = [];
            if (calendarOverrides && calendarOverrides[simDateKey]) {
              daySubjects = [...calendarOverrides[simDateKey]];
            } else {
              const cycleIndex = (currentDayIndex + dayOffset) % cycle.length;
              daySubjects = [...(cycle[cycleIndex] || [])];
            }`;

const loopReplacement = `            let daySubjects = [];
            if (calendarOverrides && calendarOverrides[simDateKey]) {
              daySubjects = [...calendarOverrides[simDateKey]];
            } else {
              const cycleIndex = (currentDayIndex + dayOffset) % cycle.length;
              const matchingRules = (futureScheduleRules || [])
                .filter(r => r.fromDate <= simDateKey && (r.dayOfWeek === targetSimDate.getDay() || r.cycleIndex === cycleIndex))
                .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

              if (matchingRules.length > 0) {
                daySubjects = [...matchingRules[0].daySlots];
              } else {
                daySubjects = [...(cycle[cycleIndex] || [])];
              }
            }`;

storeContent = storeContent.replace(loopTarget, loopReplacement);
fs.writeFileSync('src/store/useStore.js', storeContent, 'utf8');
console.log('useStore.js updated with futureScheduleRules!');
