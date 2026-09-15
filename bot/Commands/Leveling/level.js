const { getLevel, calcNeededXP } = require('../../Handlers/leveling/levels');
module.exports = {
  name: 'level',
  description: 'Show your level',
  botPermissions: 'none',
  userPermissions: 'none',
  async run(bot, prefix, message){
    const target = message.mentions.users.first() || message.author;
    const data = await getLevel(message.guild.id, target.id);
    const nextNeed = calcNeededXP(data.level+1);
    const progress = `${data.xp}/${nextNeed} XP`;
    message.channel.send(`${target.username}'s Level: ${data.level} | ${progress}`).catch(()=>{});
  }
};
