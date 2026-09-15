const { SlashCommandBuilder } = require('discord.js');
const { setRankCardBackground, PRESET_BACKGROUNDS } = require('../Handlers/leveling/levels');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setrankbg')
    .setDescription('Customize your rank card background')
    .setDMPermission(false)
    .addStringOption(o=>o.setName('value').setDescription(`Preset (${PRESET_BACKGROUNDS.join('/')}) | #hex | image URL | default`).setRequired(true)),
  cooldownMs: 5000,
  async execute(interaction){
    const value = interaction.options.getString('value');
    try {
      const res = await setRankCardBackground(interaction.guild.id, interaction.user.id, value);
      if(res.reset){
        return interaction.reply({ content: 'Background reset to default.', ephemeral: true });
      }
      let desc;
      if(res.bg_type==='preset') desc = `Preset set to **${res.bg_value}**`;
      else if(res.bg_type==='color') desc = `Solid color set to **${res.bg_value}**`;
      else desc = 'Custom image background set.';
      interaction.reply({ content: desc, ephemeral: true });
    } catch(err){
      interaction.reply({ content: err.message || 'Failed to set background.', ephemeral: true });
    }
  }
};
