const { conn } = require('./dbConnection.js');

async function listAll(){
  const [rows] = await conn.promise().query('SELECT * FROM guildTwitchAlerts WHERE enabled = 1');
  return rows;
}
async function listByGuild(guildId){
  const [rows] = await conn.promise().query('SELECT * FROM guildTwitchAlerts WHERE guildId = ?',[guildId]);
  return rows;
}
async function addSubscription(guildId, twitchUserId, login, discordChannelId){
  await conn.promise().query(`INSERT INTO guildTwitchAlerts (guildId, twitchUserId, login, discordChannelId, enabled)
    VALUES (?,?,?,?,1)
    ON DUPLICATE KEY UPDATE login=VALUES(login), discordChannelId=VALUES(discordChannelId), enabled=1`, [guildId, twitchUserId, login, discordChannelId]);
}
async function removeSubscription(guildId, twitchUserId){
  await conn.promise().query('DELETE FROM guildTwitchAlerts WHERE guildId = ? AND twitchUserId = ?',[guildId, twitchUserId]);
}
async function setMentionRole(guildId, twitchUserId, roleId){
  await conn.promise().query('UPDATE guildTwitchAlerts SET mentionRoleId = ? WHERE guildId = ? AND twitchUserId = ?',[roleId, guildId, twitchUserId]);
}
async function setTemplate(guildId, twitchUserId, template){
  await conn.promise().query('UPDATE guildTwitchAlerts SET template = ? WHERE guildId = ? AND twitchUserId = ?',[template, guildId, twitchUserId]);
}
async function setEnabled(guildId, twitchUserId, enabled){
  await conn.promise().query('UPDATE guildTwitchAlerts SET enabled = ? WHERE guildId = ? AND twitchUserId = ?',[enabled?1:0, guildId, twitchUserId]);
}
async function setLastStreamId(guildId, twitchUserId, streamId){
  await conn.promise().query('UPDATE guildTwitchAlerts SET lastStreamId = ? WHERE guildId = ? AND twitchUserId = ?',[streamId, guildId, twitchUserId]);
}
async function setChannel(guildId, twitchUserId, discordChannelId){
  await conn.promise().query('UPDATE guildTwitchAlerts SET discordChannelId = ? WHERE guildId = ? AND twitchUserId = ?',[discordChannelId, guildId, twitchUserId]);
}

module.exports = { listAll, listByGuild, addSubscription, removeSubscription, setMentionRole, setTemplate, setEnabled, setLastStreamId, setChannel };
