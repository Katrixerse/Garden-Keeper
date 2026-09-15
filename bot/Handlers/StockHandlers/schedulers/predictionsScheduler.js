const { scheduleDailyAt } = require('./dailyTimer');
const { fetchStockPredictions } = require('../api');
const { shouldDeliver } = require('../deliveryCache');
const { sendStockPredictionsEmbed } = require('../embeds');

async function runPredictions(bot, guild) {
  try {
    const predictions = await fetchStockPredictions();
    if (!predictions) return;
    const hash = JSON.stringify(predictions).length + ':' + (predictions.generatedAt || Date.now());
    if (!shouldDeliver(guild.id, 'predictions', hash)) return;

    const channel = guild.systemChannel || guild.publicUpdatesChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
    if (!channel) return;
    await sendStockPredictionsEmbed(bot, channel, predictions, null);
  } catch (e) {
    console.error('Predictions scheduler error:', e);
  }
}

function startDailyStockPredictions(bot, guild) {
  scheduleDailyAt(0, 1, () => runPredictions(bot, guild), 'stock predictions 00:01');
}

module.exports = { startDailyStockPredictions };
