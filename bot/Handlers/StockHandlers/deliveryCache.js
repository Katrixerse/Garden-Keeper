// Delivery cache with optional MySQL persistence. Falls back to memory if DB errs.
const lastSent = new Map(); // key => hash
let dbLayer = null;
try {
  dbLayer = require('../dbHandlers/deliveryCache');
} catch { /* ignore if not yet created */ }

function makeKey(guildId, sectionKey){
  return `${guildId}::${sectionKey}`;
}

async function ensureLoaded(guildId, sectionKey){
  if(!dbLayer) return; // nothing to do
  const key = makeKey(guildId, sectionKey);
  if(lastSent.has(key)) return; // already loaded
  try {
    const hash = await dbLayer.getDeliveryHash(guildId, sectionKey);
    if(hash) lastSent.set(key, hash);
  } catch(e){
    // swallow DB errors, remain in-memory
  }
}

async function shouldDeliver(guildId, sectionKey, hash){
  if(guildId == null || sectionKey == null) return false;
  if(typeof hash !== 'number' && typeof hash !== 'string') return false;
  await ensureLoaded(guildId, sectionKey);
  const key = makeKey(guildId, sectionKey);
  if(lastSent.get(key) === hash){
    return false; // already sent
  }
  lastSent.set(key, hash);
  if(dbLayer){
    dbLayer.setDeliveryHash(guildId, sectionKey, hash).catch(()=>{});
  }
  return true;
}

function getLastHash(guildId, sectionKey){
  return lastSent.get(makeKey(guildId, sectionKey));
}

module.exports = { shouldDeliver, getLastHash };
