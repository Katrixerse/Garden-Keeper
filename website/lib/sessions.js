const crypto = require('crypto');
const path = require('path');

// Reuse existing MySQL pool from the bot side
let pool;
try {
  // eslint-disable-next-line import/no-dynamic-require
  const db = require('../../bot/Handlers/dbHandlers/dbConnection.js');
  pool = db && (db.conn.promise ? db.conn.promise() : db.conn?.promise?.());
} catch (e) {
  console.error('[sessions] Failed to load MySQL pool from bot dbConnection.js:', e?.message||e);
}

// Fallback warning if no pool (sessions won’t persist)
if(!pool){
  console.warn('[sessions] MySQL pool not available. Sessions will not persist across restarts.');
}

const TABLE = 'website_sessions';

async function ensureTable(){
  if(!pool) return;
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (
      sid VARCHAR(64) PRIMARY KEY,
      data TEXT NOT NULL,
      expiresAt BIGINT NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
}
ensureTable().catch(e=>console.warn('[sessions] ensureTable error:', e?.message||e));

function parseCookies(req){
  const header = req.headers.cookie; if(!header) return {};
  return Object.fromEntries(header.split(/;\s*/).map(p=>{ const i=p.indexOf('='); if(i===-1) return [p,'']; return [decodeURIComponent(p.slice(0,i)), decodeURIComponent(p.slice(i+1))]; }));
}

async function saveSession(sid, record){
  if(!pool) return;
  try {
    await pool.execute(`REPLACE INTO ${TABLE} (sid, data, expiresAt) VALUES (?, ?, ?)`, [sid, JSON.stringify(record), record.expiresAt]);
  } catch(e){ console.warn('[sessions] saveSession error:', e?.message||e); }
}

async function loadSession(sid){
  if(!pool) return null;
  try {
    const [rows] = await pool.execute(`SELECT data, expiresAt FROM ${TABLE} WHERE sid = ?`, [sid]);
    if(!rows || rows.length === 0) return null;
    const row = rows[0];
    const data = JSON.parse(row.data);
    if(Number(row.expiresAt) <= Date.now()) return null;
    return data;
  } catch(e){ console.warn('[sessions] loadSession error:', e?.message||e); return null; }
}

function deleteSession(sid){
  if(!pool) return;
  // fire-and-forget; caller in logout doesn’t await
  pool.execute(`DELETE FROM ${TABLE} WHERE sid = ?`, [sid]).catch(()=>{});
}

function generateSession(payload){
  const sid = crypto.randomBytes(24).toString('hex');
  const maxAgeMs = 6*60*60*1000; // 6h
  const record = { ...payload, created: Date.now(), expiresAt: Date.now()+maxAgeMs };
  // persist
  saveSession(sid, record);
  return { sid, record };
}

async function sessionMiddleware(req,res,next){
  try {
    const cookies = parseCookies(req);
    const sid = cookies.sess;
    if(sid){
      const data = await loadSession(sid);
      if(data){ req.session = data; }
      else { deleteSession(sid); }
    }
  } catch(e){ /* ignore */ }
  next();
}

// periodic cleanup (DB-based)
setInterval(()=>{ if(!pool) return; pool.execute(`DELETE FROM ${TABLE} WHERE expiresAt <= ?`, [Date.now()]).catch(()=>{}); }, 30*60*1000).unref?.();

// Back-compat export for logout code: expose an object with delete(sid)
const sessions = { delete: deleteSession };

module.exports = { sessions, parseCookies, generateSession, sessionMiddleware };
