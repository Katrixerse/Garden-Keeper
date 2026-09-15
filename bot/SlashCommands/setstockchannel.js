const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { upsertGuildStockChannel, getGuildStockChannels } = require('../Handlers/dbHandlers/stockChannels');

const TYPE_CHOICES = [
  { name: 'Stock', value: 'stock' },
  { name: 'Eggs', value: 'eggs' },
  { name: 'Event', value: 'event' },
  { name: 'Merchant', value: 'merchant' },
  { name: 'Cosmetics', value: 'cosmetics' },
  { name: 'Weather', value: 'weather' }
];

const MAP_DB = {
  stock: 'stockChannelId',
  eggs: 'eggChannelId',
  event: 'eventChannelId',
  merchant: 'merchantChannelId',
  cosmetics: 'cosmeticsChannelId',
  weather: 'weatherChannelId'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setstockchannel')
    .setDescription('Configure or view custom stock/weather channel overrides')
    .setDMPermission(false)
    .addSubcommand(sc => sc
      .setName('view')
      .setDescription('View current configured overrides'))
    .addSubcommand(sc => sc
      .setName('set')
      .setDescription('Set an override for a stock-related category')
      .addStringOption(o => o.setName('type').setDescription('Category type').setRequired(true).addChoices(...TYPE_CHOICES))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to send updates to').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sc => sc
      .setName('clear')
      .setDescription('Clear an override for a category')
      .addStringOption(o => o.setName('type').setDescription('Category type').setRequired(true).addChoices(...TYPE_CHOICES))),

  cooldownMs: 3000,

  async execute(interaction) {
    if(!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if(sub === 'view') {
      const current = await getGuildStockChannels(guildId) || {};
      const lines = Object.entries(MAP_DB).map(([k, dbK]) => `${k}: ${current[dbK] ? `<#${current[dbK]}>` : 'default'}`);
      return interaction.reply({ content: 'Configured channels:\n'+lines.join('\n'), ephemeral: true });
    }

    const type = interaction.options.getString('type');
    const key = MAP_DB[type];

    if(sub === 'clear') {
      await upsertGuildStockChannel(guildId, key, null);
      return interaction.reply({ content: `${type} channel override cleared.`, ephemeral: true });
    }

    if(sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      await upsertGuildStockChannel(guildId, key, channel.id);
      return interaction.reply({ content: `${type} channel set to ${channel}.`, ephemeral: true });
    }

    return interaction.reply({ content: 'Unhandled subcommand.', ephemeral: true });
  }
};
