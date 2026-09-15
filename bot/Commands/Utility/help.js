const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['commands','h'],
  description: 'List commands or show detailed info for one command.',
  usage: 'help [command] | help [category]',
  cooldownTime: '2',
  group: 'info',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    // Build category map
    const categories = new Map();
    for (const cmd of bot.commands.values()) {
      const cat = (cmd.category || 'Other').toLowerCase();
      if(!categories.has(cat)) categories.set(cat, []);
      categories.get(cat).push(cmd);
    }
    // Sort commands in each category
    for (const list of categories.values()) list.sort((a,b)=> a.name.localeCompare(b.name));

    if (args.length) {
      const query = args[0].toLowerCase();
      // Command detail first
      const baseName = bot.aliases.get(query) || query;
      const cmd = bot.commands.get(baseName);
      if (cmd) {
        let aliases = Array.isArray(cmd.aliases) ? cmd.aliases : [];
        const embed = new EmbedBuilder()
          .setColor('#F49A32')
          .setAuthor({ name: `Help: ${cmd.name}` })
          .addFields(
            { name: 'Description', value: cmd.description || 'None', inline: false },
            { name: 'Usage', value: `${prefix}${cmd.usage || cmd.name}`, inline: false },
            { name: 'Aliases', value: aliases.length ? aliases.join(', ') : 'None', inline: false },
            { name: 'Category', value: cmd.category || 'Unknown', inline: true },
            { name: 'Cooldown', value: (bot.cooldownTime.get(cmd.name) || cmd.cooldownTime || 0) + 's', inline: true }
          );
        return message.channel.send({ embeds: [embed] });
      }
      // Category listing if command not found
      const catList = categories.get(query);
      if (catList) {
        const embed = new EmbedBuilder()
          .setColor('#F49A32')
          .setAuthor({ name: `Category: ${query}` })
          .setDescription(catList.map(c=> `**${c.name}** - ${c.description || 'No desc'}`).join('\n').slice(0,4000));
        return message.channel.send({ embeds: [embed] });
      }
    }

    // General help overview (group categories)
    const embed = new EmbedBuilder()
      .setColor('#F49A32')
      .setAuthor({ name: 'Command List' })
      .setDescription(`Use \`${prefix}help <command>\` for details, or \`${prefix}help <category>\` to list a category.`);

    // Add up to Discord field limits
    const FIELD_LIMIT = 24;
    let fieldCount = 0;
    for (const [cat, list] of [...categories.entries()].sort()) {
      if (fieldCount >= FIELD_LIMIT) break;
      const title = cat.charAt(0).toUpperCase()+cat.slice(1);
      embed.addFields({ name: title, value: list.map(c=>c.name).join(', ').slice(0,1000) || 'None', inline: false });
      fieldCount++;
    }

    message.channel.send({ embeds: [embed] });
  }
};
