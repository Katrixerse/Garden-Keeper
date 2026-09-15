const { OwnerID } = require('../../../config.json');
module.exports = {
  name: 'givecash',
  aliases: ['addcash','addmoney','givemoney'],
  description: 'Give a user cash (developer).',
  usage: 'givecash <@user|id> <amount>',
  cooldownTime: '3',
  group: 'developer',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if(message.author.id !== OwnerID) return;
    if(args.length < 2) return message.reply('Usage: givecash <user> <amount>');
    const id = (args[0].match(/\d{5,}/) || [])[0];
    if(!id) return message.reply('User not found');
    const amt = parseInt(args[1],10);
    if(!Number.isFinite(amt)) return message.reply('Invalid amount');
    try {
      const { modifyBalance, getProfile } = require('../../Handlers/economy/economy');
      await modifyBalance(message.guild.id, id, amt);
      const prof = await getProfile(message.guild.id, id);
      message.reply(`Gave ${amt} cash to <@${id}>. New balance: ${prof.cash}`);
    } catch(e){
      message.reply('Failed: '+e.message);
    }
  }
};
