const fs = require('fs');

// Test script to verify the simulation logic
console.log('Testing simulation logic...');

const today = new Date('2026-11-06T12:00:00Z');
console.log('Today:', today.toISOString());

// Simulating 38 days
const target = new Date(today);
target.setDate(target.getDate() + 38);
console.log('38 days from today:', target.toLocaleDateString('pt-BR'));
// Should be 14/12/2026!
