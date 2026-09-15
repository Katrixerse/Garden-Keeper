const { scheduleDailyAt } = require('./dailyTimer');
const { state } = require('../state');
const { fetchForeverpackAPI } = require('../api');
const { shouldDeliver } = require('../deliveryCache');
const { EmbedBuilder } = require('discord.js');

async function checkForeverPack(bot, guild) {
  try {
    const res = await fetchForeverpackAPI();
    if (!res.ok || !res.body) return;
    const rewards = Array.isArray(res.body.rewards) ? res.body.rewards : [];
    if (!rewards.length) return;

    // Find a Super Seed (case-insensitive match that contains 'super seed')
    const superSeed = rewards.find(r => typeof r.Name === 'string' && r.Name.toLowerCase().includes('super seed'));
    if (!superSeed) return; // Only act if Super Seed present

    // Build a hash that includes the item name + price so we don't resend identical announcements
    const hashSource = `superSeed:${superSeed.Name}:${superSeed.Price}`;
    if (!shouldDeliver(guild.id, 'foreverPackSuperSeed', hashSource)) return;

    const channel = guild.systemChannel || guild.publicUpdatesChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('Super Seed Located in Forever Pack!')
      .setDescription(`A Super Seed is available right now in the Forever Pack shop.\n\nItem: **${superSeed.Name}**\nPrice: **${superSeed.Price || 'Unknown'}**\nTier: **${superSeed.Tier != null ? superSeed.Tier : 'N/A'}**`)
      .setColor(0x9B59B6)
      .setTimestamp();

    if (superSeed.Image) {
      embed.setThumbnail(superSeed.Image);
    }

    // Optional role ping if a role named 'Super Seed Alerts' exists
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === 'super seed alerts');
    if (role) {
      await channel.send({ content: `<@&${role.id}>`, embeds: [embed], allowedMentions: { roles: [role.id], parse: [] } });
    } else {
      await channel.send({ embeds: [embed] });
    }

    state.lastSuperSeed = { name: superSeed.Name, price: superSeed.Price, at: Date.now() };
  } catch (e) {
    console.error('Forever pack scheduler error:', e);
  }
}

function startForeverPackScheduler(bot, guild) {
  // Run at start then every 30m for updates (example cadence)
  checkForeverPack(bot, guild);
  setInterval(() => checkForeverPack(bot, guild), 30 * 60 * 1000);
  // Reset at 20:01 daily
  scheduleDailyAt(20, 1, () => {
    state.foreverPack = null;
  }, 'foreverPack reset');
}

module.exports = { startForeverPackScheduler };
