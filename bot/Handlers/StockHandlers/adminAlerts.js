const { EmbedBuilder } = require('discord.js');

const CHANNEL_CANDIDATES = [
  'admin-restocks',
  'admin-stock',
  'restock-alerts',
  'stock-alerts'
];

function findAdminChannel(guild) {
  return guild.channels.cache.find(c => CHANNEL_CANDIDATES.includes(c.name));
}

async function sendAdminRestockAlert(bot, guild, changes) {
  if (!Array.isArray(changes) || !changes.length) return;
  const channel = findAdminChannel(guild);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Restock Update', iconURL: bot.user.displayAvatarURL() })
    .setColor(0xF49A32)
    .setTimestamp();

  for (const { label, value } of changes) {
    if (!value) continue;
    const truncated = value.length > 1000 ? value.slice(0, 1000) + '…' : value;
    embed.addFields({ name: label, value: truncated || '—', inline: false });
  }

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Failed to send admin restock alert:', err?.message || err);
  }
}

module.exports = { sendAdminRestockAlert };
