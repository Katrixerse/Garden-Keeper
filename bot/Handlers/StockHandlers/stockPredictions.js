// Placeholder prediction generator.
// In future you can implement statistical analysis of historical stock.
// For now it produces a deterministic hash-based pseudo prediction so the embed shows structure.
const crypto = require('crypto');
const { state } = require('./state');

function hashSlice(str){
  return crypto.createHash('sha1').update(str||'').digest('hex').slice(0,6);
}

async function generateStockPredictions(bot, guild){
  // Use current seed + gear stock text to derive pseudo categories
  const seedLines = (state.SeedStock||'').trim().split(/\n+/).filter(Boolean).slice(0,10);
  const gearLines = (state.GearStock||'').trim().split(/\n+/).filter(Boolean).slice(0,10);
  const fields = [];
  if(seedLines.length){
    const pred = seedLines.map(l => `${l.split(' x')[0]} → Tier ${parseInt(hashSlice(l),16)%10+1}`).slice(0,5).join('\n');
    fields.push({ name:'Seed Predictions', value: pred || 'N/A', inline:false });
  }
  if(gearLines.length){
    const pred = gearLines.map(l => `${l.split(' x')[0]} → Demand ${(parseInt(hashSlice(l),16)%5)+1}/5`).slice(0,5).join('\n');
    fields.push({ name:'Gear Predictions', value: pred || 'N/A', inline:false });
  }
  return { overview: 'Automated daily pseudo‑predictions (demo).', fields };
}

module.exports = { generateStockPredictions };
