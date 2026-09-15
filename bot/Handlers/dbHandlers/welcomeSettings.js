const { conn } = require('./dbConnection.js');

async function getWelcomeSettings(guildId){
  try {
    const [rows] = await conn.promise().query('SELECT * FROM guildWelcomeSettings WHERE guildId = ? LIMIT 1',[guildId]);
    if(rows.length) return rows[0];
    return { guildId, enabled:0, channelId:null, messageTemplate:null, backgroundUrl:null };
  } catch(e){
    console.warn('[welcomeSettings] get error:', e.message);
    return { guildId, enabled:0, channelId:null, messageTemplate:null, backgroundUrl:null };
  }
}

async function setWelcomeSettings(guildId, data){
  const { enabled=0, channelId=null, messageTemplate=null, backgroundUrl=null } = data||{};
  try {
    await conn.promise().query(`INSERT INTO guildWelcomeSettings (guildId, enabled, channelId, messageTemplate, backgroundUrl) VALUES (?,?,?,?,?)
      ON DUPLICATE KEY UPDATE enabled=VALUES(enabled), channelId=VALUES(channelId), messageTemplate=VALUES(messageTemplate), backgroundUrl=VALUES(backgroundUrl)`,
      [guildId, enabled?1:0, channelId, messageTemplate, backgroundUrl]);
    return true;
  } catch(e){
    console.warn('[welcomeSettings] set error:', e.message);
    return false;
  }
}

module.exports = { getWelcomeSettings, setWelcomeSettings };
