const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// reuse bot db connection
let db;
try { db = require('../../bot/Handlers/dbHandlers/dbConnection.js'); } catch {}
const pool = db?.conn?.promise?.() || db?.conn?.promise?.();

async function getPending(token){
  if(!pool) return null;
  try {
    const [rows] = await pool.query('SELECT * FROM guildCaptchaPending WHERE token = ? LIMIT 1',[token]);
    return rows[0] || null;
  } catch(e){ return null; }
}
async function deletePending(token){ if(!pool) return; try { await pool.query('DELETE FROM guildCaptchaPending WHERE token = ?',[token]); } catch{} }
async function getSettings(guildId){
  if(!pool) return null; try { const [r] = await pool.query('SELECT * FROM guildCaptchaSettings WHERE guildId = ? LIMIT 1',[guildId]); return r[0]||null; } catch{ return null; }
}

router.get('/garden-keeper/verify', async (req,res)=>{
  const token = (req.query.token||'').toString().trim();
  if(!token) return res.status(400).send('Missing token');
  const pending = await getPending(token);
  if(!pending) return res.status(400).send('Invalid or expired token');
  // Simple HTML form
  return res.send(`<!DOCTYPE html><html><head><title>Verification</title></head><body style="font-family: system-ui; max-width:600px; margin:40px auto;">
  <h1>Server Verification</h1>
  <p>Please enter the code you were sent in a DM to join the server.</p>
  <form method="POST" action="/garden-keeper/verify">
    <input type="hidden" name="token" value="${token}" />
    <label>Code: <input name="code" maxlength="10" required autofocus /></label>
    <button type="submit">Verify</button>
  </form>
  </body></html>`);
});

router.post('/garden-keeper/verify', express.urlencoded({extended:true}), async (req,res)=>{
  const token = (req.body.token||'').toString().trim();
  const code = (req.body.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!token || !code) return res.status(400).send('Missing token/code');
  const pending = await getPending(token);
  if(!pending) return res.status(400).send('Invalid or expired token');
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  if(hash !== pending.answerHash){
    return res.status(400).send('Incorrect code. <a href="/garden-keeper/verify?token='+encodeURIComponent(token)+'">Try again</a>');
  }
  // grant role via bot client
  const clientRef = req.app.get('discordClient');
  if(!clientRef) return res.status(503).send('Bot not attached');
  try {
    const guild = await clientRef.guilds.fetch(pending.guildId);
    const member = await guild.members.fetch(pending.userId);
    const settings = await getSettings(pending.guildId);
    if(settings && settings.enabled && settings.roleId){
      const role = guild.roles.cache.get(settings.roleId) || await guild.roles.fetch(settings.roleId).catch(()=>null);
      if(role) await member.roles.add(role, 'Captcha verified');
    }
  } catch(e){ console.warn('captcha role grant error', e?.message||e); }
  await deletePending(token);
  return res.send('<h2>Verification complete!</h2><p>You may return to Discord.</p>');
});

module.exports = router;
