const { SlashCommandBuilder } = require('discord.js');
const { getLevel, calcNeededXP } = require('../Handlers/leveling/levels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Show level for a user')
    .setDMPermission(false)
    .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(false)),
  cooldownMs: 3000,
  async execute(interaction){
    const user = interaction.options.getUser('user') || interaction.user;
    const { xp, level } = await getLevel(interaction.guild.id, user.id);
    const next = calcNeededXP(level+1);
    await interaction.reply({ content: `${user.username}'s Level: **${level}** (${xp}/${next} XP)` });
  }
};
