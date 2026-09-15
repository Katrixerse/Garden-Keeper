const { conn } = require('../dbHandlers/dbConnection.js');

async function getAuditSettings(guildId){
  try {
    const [rows] = await conn.promise().query('SELECT * FROM guildModAuditSettings WHERE guildId = ? LIMIT 1',[guildId]);
    if(rows.length) return rows[0];
    return { guildId, channelId:null, enabled:0 };
  } catch(e){
    console.warn('[auditLog] settings get error:', e.message);
    return { guildId, channelId:null, enabled:0 };
  }
}

async function setAuditSettings(guildId, data){
  const { channelId=null, enabled=0 } = data||{};
  try {
    await conn.promise().query(`INSERT INTO guildModAuditSettings (guildId, channelId, enabled) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE channelId=VALUES(channelId), enabled=VALUES(enabled)`,[guildId, channelId, enabled?1:0]);
    return true;
  } catch(e){
    console.warn('[auditLog] settings set error:', e.message);
    return false;
  }
}

async function logAction(guildId, action, { targetId=null, moderatorId=null, reason=null, extra=null } = {}){
  try {
    const [res] = await conn.promise().query('INSERT INTO guildModAuditLog (guildId, action, targetId, moderatorId, reason, extra) VALUES (?,?,?,?,?,?)',[
      guildId, action, targetId, moderatorId, reason, extra?JSON.stringify(extra):null
    ]);
    return res.insertId || null;
  } catch(e){
    console.warn('[auditLog] log error:', e.message);
    return null;
  }
}

async function fetchRecent(guildId, limit=25){
  try {
    const [rows] = await conn.promise().query('SELECT id, action, targetId, moderatorId, reason, extra, createdAt FROM guildModAuditLog WHERE guildId = ? ORDER BY id DESC LIMIT ?', [guildId, Math.min(200, Math.max(1, limit))]);
    return rows.map(r => ({
      id: r.id, action: r.action, targetId: r.targetId, moderatorId: r.moderatorId, reason: r.reason, extra: safeJson(r.extra), createdAt: r.createdAt
    }));
  } catch(e){ return []; }
}

function safeJson(s){ try { return s?JSON.parse(s):null; } catch { return null; } }

module.exports = { getAuditSettings, setAuditSettings, logAction, fetchRecent };
