const { getPlots, refreshGrowthStates } = require('../../Handlers/economy/economy');
module.exports = {
  name:'garden',
  description:'View your plots and growth stages.',
  async run(bot,prefix,message,args){
    const target = message.mentions.users.first() || message.author;
    await refreshGrowthStates(message.guild.id, target.id);
    const { profile, plots, seeds } = await getPlots(message.guild.id, target.id);
    const symbols = {0:'▫️',1:'🌱',2:'🌿',3:'🌾',4:'🧺'};
    const lines = plots.map(p=>{
      const t = p.seedType || '—';
      return `Slot ${p.slot}: ${symbols[p.stage]} (${t})`;
    });
    const seedInv = Object.entries(seeds).filter(([k,v])=>v>0).map(([k,v])=>`${k}:${v}`).join(' ' ) || 'None';
    message.reply(`Plots for ${target.username}\n${lines.join('\n')}\nInventory: ${seedInv}\nCash: $${profile.cash}`);
  }
};
