const { EmbedBuilder, ChannelType } = require('discord.js');
module.exports = {
  name: 'channelinfo',
  aliases: ['ci'],
  description: 'Shows information about a channel.',
  usage: 'channelinfo [#channel|id]',
  cooldownTime: '3',
  group: 'info',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    let channel = message.channel;
    if(args.length){
      const id = (args[0].match(/\d{5,}/)||[])[0];
      if(id) channel = message.guild.channels.cache.get(id) || channel;
    }
    if(!channel) return message.reply('Channel not found');
    const created = `<t:${Math.floor(channel.createdTimestamp/1000)}:f> (<t:${Math.floor(channel.createdTimestamp/1000)}:R>)`;
    const typeName = ChannelType[channel.type] || 'Unknown';
    const embed = new EmbedBuilder()
      .setColor('#F49A32')
      .setAuthor({ name: `#${channel.name}` })
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: String(typeName), inline: true },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: created, inline: false }
      );
    if(channel.topic) embed.addFields({ name: 'Topic', value: channel.topic.slice(0,1000), inline: false });
    message.channel.send({ embeds: [embed] });
  }
};
