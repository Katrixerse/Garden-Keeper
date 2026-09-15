const { conn } = require('./dbConnection.js');

async function getPrefix(guildId){
  try {
    const [rows] = await conn.promise().query('SELECT prefix FROM guildPrefix WHERE guildId = ? LIMIT 1',[guildId]);
    if(rows.length) return rows[0].prefix;
    return 'g!';
  } catch(e){
    console.warn('[prefix] get error:', e.message);
    return 'g!';
  }
}

async function setPrefix(guildId, prefix){
  const clean = String(prefix || '').trim().slice(0,5) || 'g!';
  try {
    await conn.promise().query('INSERT INTO guildPrefix (guildId, prefix) VALUES (?,?) ON DUPLICATE KEY UPDATE prefix=VALUES(prefix)',[guildId, clean]);
    return clean;
  } catch(e){
    console.warn('[prefix] set error:', e.message);
    return null;
  }
}

module.exports = { getPrefix, setPrefix };
