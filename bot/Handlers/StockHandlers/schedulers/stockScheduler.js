const { fetchAPI } = require("../api");
const { state } = require("../state");
const { shouldDeliver } = require("../deliveryCache");
const { sendStockEmbed, sendEggStockEmbed, sendEventShopEmbed, sendTravelingMerchantStockEmbed, sendCosmeticStockEmbed } = require("../embeds");
const { sendAdminRestockAlert } = require("../adminAlerts");
const { getGuildStockChannels } = require("../../dbHandlers/stockChannels");

function next5mBoundaryAtSecond30(now = new Date()) {
  const m = now.getMinutes();
  const addMin = (5 - (m % 5)) % 5;
  const target = new Date(now);
  target.setMilliseconds(0);
  target.setSeconds(30);
  target.setMinutes(m + addMin);
  if (target <= now) target.setMinutes(target.getMinutes() + 5);
  return target;
}

async function resolveChannels(bot, guild) {
  const overrides = await getGuildStockChannels(guild.id).catch(()=>null);
  if(!overrides) return {};
  const map = {};
  const mapping = {
    core: 'stockChannelId',
    egg: 'eggChannelId',
    event: 'eventChannelId',
    tm: 'merchantChannelId',
    cosmetic: 'cosmeticsChannelId',
    weather: 'weatherChannelId'
  };
  for(const key of Object.keys(mapping)){
    const field = mapping[key];
    if(overrides[field]){
      const ch = await bot.channels.fetch(overrides[field]).catch(()=>null);
      if(ch) map[key] = ch;
    }
  }
  return map;
}

function selectChannel(channels, fallback, key) {
  return channels[key] || fallback;
}

async function dispatchEmbeds(bot, guild, data, changedSections, channels) {
  const fallback = guild.systemChannel || guild.publicUpdatesChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has("SendMessages"));
  if (!fallback) return;

  const DEBUG = process.env.STOCK_DEBUG === '1';

  async function getLastBotEmbed(channel){
    try {
      const msgs = await channel.messages.fetch({ limit: 5 }).catch(()=>null);
      if(!msgs) return null;
      const mine = msgs.filter(m => m.author.id === bot.user.id).first();
      if(!mine || !mine.embeds.length) return null;
      return mine.embeds[0];
    } catch { return null; }
  }

  // Helper comparison per section; ignores embed timestamp/color.
  async function alreadyMatches(sectionKey, channel){
    const embed = await getLastBotEmbed(channel);
    if(!embed) return false;
    const fields = embed.fields || [];
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    switch(sectionKey){
      case 'core': {
        const seed = fields.find(f=>f.name==='Seed Stock:');
        const gear = fields.find(f=>f.name==='Gear Stock:');
        if(!seed || !gear) return false;
        return norm(seed.value) === norm(state.SeedStock) && norm(gear.value) === norm(state.GearStock);
      }
      case 'egg': {
        const f = fields.find(f=>f.name==='Egg Stock:');
        return !!f && norm(f.value) === norm(state.EggStock);
      }
      case 'event': {
        const f = fields.find(f=>f.name==='Event Stock:');
        // Compare against raw event stock string (not the cached/sentinel value)
        return !!f && norm(f.value) === norm(state.eventStock);
      }
      case 'tm': {
        const f = fields.find(f=>f.name==='Traveling Merchant Has Arrived');
        // Compare against raw merchant text; normalization avoids trivial whitespace diffs
        return !!f && norm(f.value) === norm(state.travelingMerchantStock);
      }
      case 'cosmetic': {
        const f = fields.find(f=>f.name==='Cosmetics Stock:');
        // Compare against raw cosmetic stock string
        return !!f && norm(f.value) === norm(state.cosmeticStock);
      }
      default: return false;
    }
  }

  // Core stock
  if (changedSections.core) {
    const ch = selectChannel(channels, fallback, 'core');
    if (ch) {
      if(await alreadyMatches('core', ch)) { if(DEBUG) console.log('[StockScheduler] Suppressed duplicate core embed'); } else { await sendStockEmbed(bot, guild, ch); }
    }
  }
  if (changedSections.egg) {
    const ch = selectChannel(channels, fallback, 'egg');
    if (ch) {
      if(await alreadyMatches('egg', ch)) { if(DEBUG) console.log('[StockScheduler] Suppressed duplicate egg embed'); } else { await sendEggStockEmbed(bot, guild, ch); }
    }
  }
  if (changedSections.event) {
    //const ch = selectChannel(channels, fallback, 'event');
    //if (ch) {
    //  if(await alreadyMatches('event', ch)) { if(DEBUG) console.log('[StockScheduler] Suppressed duplicate event embed'); } else { await sendEventShopEmbed(bot, guild, ch); }
    //}
    // Event stock embeds are currently disabled due to not having an event shop in game anymore
  }
  if (changedSections.tm) {
    const ch = selectChannel(channels, fallback, 'tm');
    if (ch) {
      if(await alreadyMatches('tm', ch)) { if(DEBUG) console.log('[StockScheduler] Suppressed duplicate merchant embed'); } else { await sendTravelingMerchantStockEmbed(bot, guild, ch); }
    }
  }
  if (changedSections.cosmetic) {
    const ch = selectChannel(channels, fallback, 'cosmetic');
    if (ch) {
      if(await alreadyMatches('cosmetic', ch)) { if(DEBUG) console.log('[StockScheduler] Suppressed duplicate cosmetic embed'); } else { await sendCosmeticStockEmbed(bot, guild, ch); }
    }
  }
  if (changedSections.adminRestock) {
    const ch = selectChannel(channels, fallback, 'admin');
    if (ch) await sendAdminRestockAlert(bot, ch, changedSections.adminRestock, data);
  }
}

function detectChangedSections(guildId){
  const mapping = [
    { key: 'core', cacheKey: 'storeStock' },
    { key: 'egg', cacheKey: 'storeEggStock' },
    { key: 'event', cacheKey: 'storeEventStock' },
    { key: 'tm', cacheKey: 'storeTravelingMerchantStock' },
    { key: 'cosmetic', cacheKey: 'storeCosmeticStock' }
  ];
  const changed = {};
  for(const m of mapping){
    const meta = state.cache[m.cacheKey];
    if(!meta || meta.hash == null) continue;
    const val = state[m.cacheKey];
    if(val === 'no new stock') continue; // unchanged sentinel
    // Use per-section delivery cache; if shouldDeliver true we flag changed.
    if(shouldDeliver(guildId, `stock-${m.key}`, meta.hash)){
      changed[m.key] = true;
    }
  }
  return changed;
}

async function checkNewStock(bot, guild) {
  try {
    const res = await fetchAPI(bot);
    if (!res || res.ok === false) return;

    const changed = detectChangedSections(guild.id);
    if (!Object.keys(changed).length) return; // nothing new to send

    const channels = await resolveChannels(bot, guild);
    await dispatchEmbeds(bot, guild, res, changed, channels);
  } catch (err) {
    console.error('Stock scheduler error:', err);
  }
}

function startStockScheduler(bot, guild) {
  const now = new Date();
  const target = next5mBoundaryAtSecond30(now);
  const initialDelay = target.getTime() - now.getTime();
  console.log('Scheduling restock check in', Math.round(initialDelay / 1000), 'seconds.');
  setTimeout(() => {
    checkNewStock(bot, guild);
    setInterval(() => checkNewStock(bot, guild), 5 * 60 * 1000);
  }, initialDelay);
}

module.exports = { startStockScheduler };
