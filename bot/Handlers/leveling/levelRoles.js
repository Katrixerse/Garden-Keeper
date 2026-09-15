const { conn } = require('../dbHandlers/dbConnection');

async function getLevelRoles(guildId){
  try {
    const [rows] = await conn.promise().query('SELECT level, roleId, grantMode FROM guildLevelRoles WHERE guildId=? ORDER BY level ASC',[guildId]);
    return rows;
  } catch(e){
    console.warn('[levelRoles] get error:', e.message); return [];
  }
}

async function setLevelRole(guildId, level, roleId, grantMode='stack'){
  level = parseInt(level);
  if(!Number.isFinite(level) || level < 1 || level > 10000) throw new Error('Invalid level');
  if(!/^\d{5,20}$/.test(String(roleId))) throw new Error('Invalid role ID');
  grantMode = grantMode === 'replace' ? 'replace' : 'stack';
  try {
    await conn.promise().query('INSERT INTO guildLevelRoles (guildId, level, roleId, grantMode) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE grantMode=VALUES(grantMode)', [guildId, level, roleId, grantMode]);
    return true;
  } catch(e){ console.warn('[levelRoles] set error:', e.message); return false; }
}

async function removeLevelRole(guildId, level, roleId){
  try {
    await conn.promise().query('DELETE FROM guildLevelRoles WHERE guildId=? AND level=? AND roleId=?',[guildId, level, roleId]);
    return true;
  } catch(e){ console.warn('[levelRoles] remove error:', e.message); return false; }
}

module.exports = { getLevelRoles, setLevelRole, removeLevelRole };
