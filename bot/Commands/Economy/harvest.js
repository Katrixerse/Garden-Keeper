module.exports = {
  name:'harvest',
  description:'Harvest a ready plant (g!harvest <slot>)',
  async run(bot,prefix,message,args){
    const slot = parseInt(args[0],10);
    if(!slot) return message.reply('Provide a slot number.');
    try {
      const { harvest } = require('../../Handlers/economy/economy');
      const res = await harvest(message.guild.id, message.author.id, slot);
      message.reply(`Harvested ${res.seedType} in slot ${slot} for $${res.reward}. New balance: $${res.profile.cash}`);
    } catch(e){
      message.reply(`Cannot harvest: ${e.message}`);
    }
  }
};
