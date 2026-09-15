const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
module.exports = {
  name: 'serverinfo',
  aliases: ['guildinfo','si'],
  description: 'Shows information about the current server.',
  usage: 'serverinfo',
  cooldownTime: '3',
  group: 'info',
  botPermissions: ['none'],
  run: async (bot, prefix, message) => {
    const g = message.guild;
    if(!g) return;
    await g.fetch();
    const owner = await g.fetchOwner().catch(()=>null);
    const roles = g.roles.cache.size;
    const channels = g.channels.cache.size;
    const textChannels = g.channels.cache.filter(c=>c.type===0).size;
    const voiceChannels = g.channels.cache.filter(c=>c.type===2).size;
    const created = `<t:${Math.floor(g.createdTimestamp/1000)}:f> (<t:${Math.floor(g.createdTimestamp/1000)}:R>)`;
    const embed = new EmbedBuilder()
      .setAuthor({ name: g.name, iconURL: g.iconURL() })
      .setColor('#F49A32')
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Owner', value: owner ? `${owner.user.tag} (${owner.id})` : 'Unknown', inline: true },
        { name: 'Created', value: created, inline: false },
        { name: 'Members', value: `${g.memberCount}`, inline: true },
        { name: 'Channels', value: `${channels} (Text: ${textChannels} / Voice: ${voiceChannels})`, inline: true },
        { name: 'Roles', value: `${roles}`, inline: true },
      );
    message.channel.send({ embeds: [embed] });
  }
};
