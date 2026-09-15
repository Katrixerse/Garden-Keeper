const { fetchAdminMessagesAPI } = require('../api');
const crypto = require('crypto');
const { shouldDeliver } = require('../deliveryCache');

const adminState = { lastHash: null };

function hashMessages(messages) {
  const raw = messages.map(m => `${m.timestamp}|${m.message}`).join('\n');
  return crypto.createHash('sha1').update(raw).digest('hex');
}

async function checkAdminMessages(bot, guild, channelResolver) {
  try {
    const { messages } = await fetchAdminMessagesAPI();
    if (!messages || !messages.length) return;
    const h = hashMessages(messages);
    if (h === adminState.lastHash) return;
    if (!shouldDeliver(guild.id, 'adminMessages', h)) return;

    adminState.lastHash = h;
    const channel = typeof channelResolver === 'function' ? await channelResolver() : (guild.systemChannel || guild.publicUpdatesChannel);
    if (!channel) return;
    const first = messages[0];
    await channel.send(`Admin Message: ${first.message}`);
  } catch (e) {
    console.error('Admin messages scheduler error:', e);
  }
}

function startAdminMessagesScheduler(bot, guild, channelResolver) {
  // Poll every 10 minutes
  setInterval(() => checkAdminMessages(bot, guild, channelResolver), 10 * 60 * 1000);
  checkAdminMessages(bot, guild, channelResolver);
}

module.exports = { startAdminMessagesScheduler };
