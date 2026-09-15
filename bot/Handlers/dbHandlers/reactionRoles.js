const { conn } = require('./dbConnection');

async function addReactionRole(guildId, messageId, channelId, emoji, roleId){
  return conn.promise().query(
    'REPLACE INTO reactionRoles (guildId, messageId, channelId, emoji, roleId) VALUES (?,?,?,?,?)',
    [guildId, messageId, channelId, emoji, roleId]
  );
}
async function removeReactionRole(guildId, messageId, emoji){
  return conn.promise().query('DELETE FROM reactionRoles WHERE guildId=? AND messageId=? AND emoji=?',[guildId,messageId,emoji]);
}
async function clearReactionRolesForMessage(guildId, messageId){
  return conn.promise().query('DELETE FROM reactionRoles WHERE guildId=? AND messageId=?',[guildId,messageId]);
}
async function getReactionRolesForMessage(guildId, messageId){
  const [rows] = await conn.promise().query('SELECT * FROM reactionRoles WHERE guildId=? AND messageId=?',[guildId,messageId]);
  return rows;
}
async function getAllReactionRolesForGuild(guildId){
  const [rows] = await conn.promise().query('SELECT * FROM reactionRoles WHERE guildId=?',[guildId]);
  return rows;
}
module.exports = { addReactionRole, removeReactionRole, clearReactionRolesForMessage, getReactionRolesForMessage, getAllReactionRolesForGuild };
