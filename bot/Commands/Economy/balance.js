module.exports = {
  name:'balance',
  aliases:['bal','money','cash'],
  description:'View your garden cash.',
  async run(bot,prefix,message,args){
    const target = message.mentions.users.first() || message.author;
    const { getProfile, getAllSeeds } = require('../../Handlers/economy/economy');
    const prof = await getProfile(message.guild.id, target.id);
    const inv = await getAllSeeds(message.guild.id, target.id);
    const seedStr = Object.entries(inv).filter(([k,v])=>v>0).map(([k,v])=>`${k}:${v}`).join(' ') || 'None';
    message.reply(`${target.username}'s balance: $${prof.cash.toLocaleString()} | Seeds: ${seedStr}`);
  }
};
