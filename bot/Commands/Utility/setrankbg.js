const { setRankCardBackground, PRESET_BACKGROUNDS } = require('../../Handlers/leveling/levels');
module.exports = {
  name: 'setrankbg',
  description: 'Set your rank card background (preset | #hex | image URL | default)',
  usage: 'setrankbg <value>',
  botPermissions: 'SendMessages',
  userPermissions: 'none',
  async run(bot, prefix, message){
    const arg = message.content.split(/\s+/).slice(1).join(' ');
    if(!arg){
      return message.reply(`Provide a background. Presets: ${PRESET_BACKGROUNDS.join(', ')} or #hex or image URL (.png/.jpg/.jpeg/.webp) or 'default'`).catch(()=>{});
    }
    try {
      const res = await setRankCardBackground(message.guild.id, message.author.id, arg);
      if(res.reset){
        return message.reply('Background reset to default.').catch(()=>{});
      }
      let desc;
      if(res.bg_type==='preset') desc = `Preset set to **${res.bg_value}**`;
      else if(res.bg_type==='color') desc = `Solid color set to **${res.bg_value}**`;
      else desc = 'Custom image background set.';
      message.reply(desc).catch(()=>{});
    } catch(err){
      message.reply(err.message || 'Failed to set background.').catch(()=>{});
    }
  }
};
