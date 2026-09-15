module.exports = {
  name:'plant',
  description:'Plant a seed in a slot (g!plant <slot> [type])',
  async run(bot,prefix,message,args){
    const slot = parseInt(args[0],10);
    if(!slot) return message.reply('Provide a slot number.');
    const type = args[1]?.toLowerCase();
    try {
      const { plantSeed, SEED_TYPES } = require('../../Handlers/economy/economy');
      if(type && !SEED_TYPES[type]) return message.reply('Unknown seed type.');
      await plantSeed(message.guild.id, message.author.id, slot, type||'basic');
      message.reply(`Planted ${type||'basic'} seed in slot ${slot}.`);
    } catch(e){
      message.reply(`Cannot plant: ${e.message}`);
    }
  }
};
