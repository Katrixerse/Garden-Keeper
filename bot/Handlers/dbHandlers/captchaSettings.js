const { conn } = require('./dbConnection.js');

async function getCaptchaSettings(guildId){
  try {
    const [rows] = await conn.promise().query('SELECT * FROM guildCaptchaSettings WHERE guildId = ? LIMIT 1',[guildId]);
    if(rows.length) return rows[0];
    return { guildId, enabled:0, roleId:null };
  } catch(e){
    console.warn('[captchaSettings] get error:', e.message);
    return { guildId, enabled:0, roleId:null };
  }
}

async function setCaptchaSettings(guildId, data){
  const { enabled=0, roleId=null } = data||{};
  try {
    await conn.promise().query(`INSERT INTO guildCaptchaSettings (guildId, enabled, roleId) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE enabled=VALUES(enabled), roleId=VALUES(roleId)`, [guildId, enabled?1:0, roleId]);
    return true;
  } catch(e){
    console.warn('[captchaSettings] set error:', e.message);
    return false;
  }
}

async function createPending({ token, guildId, userId, challenge, answerHash }){
  try {
    await conn.promise().query(`INSERT INTO guildCaptchaPending (token, guildId, userId, challenge, answerHash) VALUES (?,?,?,?,?)`, [token, guildId, userId, challenge, answerHash]);
    return true;
  } catch(e){
    console.warn('[captchaSettings] createPending error:', e.message);
    return false;
  }
}

async function getPendingByToken(token){
  try {
    const [rows] = await conn.promise().query('SELECT * FROM guildCaptchaPending WHERE token = ? LIMIT 1',[token]);
    return rows[0] || null;
  } catch(e){
    console.warn('[captchaSettings] getPendingByToken error:', e.message);
    return null;
  }
}

async function deletePending(token){
  try { await conn.promise().query('DELETE FROM guildCaptchaPending WHERE token = ?',[token]); } catch{}
}

async function deleteForUser(guildId, userId){
  try { await conn.promise().query('DELETE FROM guildCaptchaPending WHERE guildId = ? AND userId = ?',[guildId, userId]); } catch{}
}

module.exports = { getCaptchaSettings, setCaptchaSettings, createPending, getPendingByToken, deletePending, deleteForUser };
