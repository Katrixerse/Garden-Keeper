module.exports = {
  name: 'buyseeds',
  aliases: ['buyseed','seedsbuy','seedbuy'],
  description: 'Dynamic hourly seed shop. Usage: g!buyseeds | g!buyseeds <type> <amount>',
  async run(bot,prefix,message,args){
    const { getRotation, purchaseRotatedSeed, SEED_TYPES, getUserPurchases } = require('../../Handlers/economy/economy');
    if(!args.length){
      const rot = await getRotation(message.guild.id);
      const userPurch = await getUserPurchases(message.guild.id, message.author.id);
      const remainingMs = rot.expiresAt - Date.now();
      const mins = Math.max(0, Math.floor(remainingMs/60000));
      const lines = rot.seeds.map(r=>{
        const def = SEED_TYPES[r.seedType];
        const bought = userPurch.map[r.seedType] || 0;
        const perUserCap = Math.max(1, Math.floor((r.stock + bought) * 0.4));
        return `${r.seedType} [${def.rarity}] $${def.baseCost} | stock ${r.stock} | you ${bought}/${perUserCap}`;
      });
      return message.reply(`Hourly Rotation (refresh in ~${mins}m)\n${lines.join('\n')}`);
    }
    const type = args[0];
    const amt = parseInt(args[1],10);
    if(!amt || amt < 1) return message.reply('Provide an amount >= 1');
    try {
      const res = await purchaseRotatedSeed(message.guild.id, message.author.id, type, amt);
      return message.reply(`Purchased ${amt} ${res.seedType} for $${res.totalCost}. Remaining stock: ${res.remaining}.`);
    } catch(e){
      return message.reply(`Purchase failed: ${e.message}`);
    }
  }
};
