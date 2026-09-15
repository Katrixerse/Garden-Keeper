const { OwnerID } = require('../../../config.json');
module.exports = {
  name: 'setxp',
  aliases: ['setlevelxp'],
  description: 'Force set a user\'s XP (developer).',
  usage: 'setxp <@user|id> <xp>',
  cooldownTime: '3',
  group: 'developer',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if(message.author.id !== OwnerID) return;
    if(args.length < 2) return message.reply('Usage: setxp <user> <xp>');
    const id = (args[0].match(/\d{5,}/) || [])[0];
    if(!id) return message.reply('User not found');
    const xp = parseInt(args[1],10);
    if(!Number.isFinite(xp) || xp < 0) return message.reply('Invalid XP');
    try {
      const { setXP } = require('../../Handlers/leveling/levels');
      await setXP(message.guild.id, id, xp);
      message.reply(`Set XP for <@${id}> to ${xp}.`);
    } catch(e){
      message.reply('Failed: '+e.message);
    }
  }
};
