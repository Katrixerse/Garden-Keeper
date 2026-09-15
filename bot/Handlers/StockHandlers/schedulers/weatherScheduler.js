const { fetchWeatherAPI } = require("../api");
const { weatherState } = require("../state");
const { shouldDeliver } = require("../deliveryCache");
const { sendWeatherEmbed } = require("../embeds");
const { getGuildStockChannels } = require("../../dbHandlers/stockChannels");

function next15sDelayAtSecond15(now = new Date()) {
  const offset = 15;
  const mod = 15;
  const s = now.getSeconds();
  const ms = now.getMilliseconds();
  let delta = (mod - ((s - offset + 60) % mod)) % mod;
  if (delta === 0) delta = mod;
  return delta * 1000 - ms;
}

async function resolveWeatherChannel(bot, guild) {
  const overrides = await getGuildStockChannels(guild.id).catch(()=>null);
  if (overrides && overrides.weatherChannelId) {
    const ch = await bot.channels.fetch(overrides.weatherChannelId).catch(() => null);
    if (ch) return ch;
  }
  return guild.systemChannel || guild.publicUpdatesChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has("SendMessages"));
}

function weatherSignature(event) {
  if (!event) return 'none';
  return [event.type, event.location, event.severity].filter(Boolean).join(':');
}

async function checkActiveWeather(bot, guild) {
  try {
    const data = await fetchWeatherAPI();
    if (!data) return;
    const current = data.currentEvent || null;
    const sig = weatherSignature(current);
    if (sig === weatherState.lastSignature) return; // no change

    weatherState.lastSignature = sig;
    if (!shouldDeliver(guild.id, 'weather', sig)) return;

    const channel = await resolveWeatherChannel(bot, guild);
    if (!channel) return;
  await sendWeatherEmbed(bot, guild, channel, current, data);
  } catch (e) {
    console.error('Weather scheduler error:', e);
  }
}

function startWeatherScheduler(bot, guild) {
  const initialDelay = next15sDelayAtSecond15(new Date());
  console.log('Scheduling weather check in', Math.round(initialDelay / 1000), 'seconds.');
  setTimeout(() => {
    checkActiveWeather(bot, guild);
    setInterval(() => checkActiveWeather(bot, guild), 15 * 1000);
  }, initialDelay);
}

module.exports = { startWeatherScheduler };
