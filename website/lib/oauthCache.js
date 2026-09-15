// Lightweight in-memory OAuth cache (user + guilds) with TTL
// Keys are typically the access token string; values carry an expires timestamp.

const userCache = new Map();
const guildsCache = new Map();

function now(){ return Date.now(); }

function getFrom(cache, key){
  if(!key) return null;
  const hit = cache.get(key);
  if(!hit) return null;
  if(hit.expires <= now()){ cache.delete(key); return null; }
  return hit.data;
}

function setInto(cache, key, data, ttlMs){
  if(!key) return;
  const ttl = Math.max(1000, Number(ttlMs||0) || 120_000); // default 2m
  cache.set(key, { data, expires: now() + ttl });
}

// Public API
function getUser(key){ return getFrom(userCache, key); }
function setUser(key, data, ttlMs){ return setInto(userCache, key, data, ttlMs); }
function getGuilds(key){ return getFrom(guildsCache, key); }
function setGuilds(key, data, ttlMs){ return setInto(guildsCache, key, data, ttlMs); }

// Periodic cleanup to prevent unbounded growth
setInterval(()=>{
  const t = now();
  for(const [k,v] of userCache){ if(v.expires <= t) userCache.delete(k); }
  for(const [k,v] of guildsCache){ if(v.expires <= t) guildsCache.delete(k); }
}, 60_000).unref?.();

module.exports = { getUser, setUser, getGuilds, setGuilds };
