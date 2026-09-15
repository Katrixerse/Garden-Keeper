const { conn } = require('./dbConnection.js');

async function listAll(){
  const [rows] = await conn.promise().query('SELECT * FROM guildYouTubeAlerts WHERE enabled = 1');
  return rows;
}
async function listByGuild(guildId){
  const [rows] = await conn.promise().query('SELECT * FROM guildYouTubeAlerts WHERE guildId = ?',[guildId]);
  return rows;
}
async function addSubscription(guildId, ytChannelId, discordChannelId){
  await conn.promise().query(`INSERT INTO guildYouTubeAlerts (guildId, ytChannelId, discordChannelId, enabled)
    VALUES (?,?,?,1)
    ON DUPLICATE KEY UPDATE discordChannelId=VALUES(discordChannelId), enabled=1`, [guildId, ytChannelId, discordChannelId]);
}
async function removeSubscription(guildId, ytChannelId){
  await conn.promise().query('DELETE FROM guildYouTubeAlerts WHERE guildId = ? AND ytChannelId = ?',[guildId, ytChannelId]);
}
async function setMentionRole(guildId, ytChannelId, roleId){
  await conn.promise().query('UPDATE guildYouTubeAlerts SET mentionRoleId = ? WHERE guildId = ? AND ytChannelId = ?',[roleId, guildId, ytChannelId]);
}
async function setTemplate(guildId, ytChannelId, template){
  await conn.promise().query('UPDATE guildYouTubeAlerts SET template = ? WHERE guildId = ? AND ytChannelId = ?',[template, guildId, ytChannelId]);
}
async function setEnabled(guildId, ytChannelId, enabled){
  await conn.promise().query('UPDATE guildYouTubeAlerts SET enabled = ? WHERE guildId = ? AND ytChannelId = ?',[enabled?1:0, guildId, ytChannelId]);
}
async function setLastVideoId(guildId, ytChannelId, videoId){
  await conn.promise().query('UPDATE guildYouTubeAlerts SET lastVideoId = ? WHERE guildId = ? AND ytChannelId = ?',[videoId, guildId, ytChannelId]);
}

module.exports = { listAll, listByGuild, addSubscription, removeSubscription, setMentionRole, setTemplate, setEnabled, setLastVideoId };
