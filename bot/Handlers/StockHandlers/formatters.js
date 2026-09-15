const { state, weatherState, updateCachedSection } = require("./state");
const { fetchLastSeen } = require("./lastSeen");

function buildLastSeenTag(name){
    if(state.lastSeenTime[name] === 'Now') return 'Now';
    if(Object.prototype.hasOwnProperty.call(state.lastSeenTime, name)){
        const ts = Object.entries(state.lastSeenTime)
            .filter(([k]) => k === name)
            .map(([,v]) => v).toString();
        if(ts && ts !== 'Now') return `<t:${ts}:f>`;
    }
    return 'Never';
}

async function accumulateStock(bot, list, target){
    state[target] = '';
    for(const item of list){
        await fetchLastSeen(bot, item.display_name, item.start_date_unix);
        const tag = buildLastSeenTag(item.display_name);
        if(tag === 'Now'){
            state[target] += `${item.display_name} x${item.quantity}\n`;
        } else {
            state[target] += `${item.display_name} x${item.quantity} [last seen: ${tag}]\n`;
        }
    }
}

async function formatStock(bot, stock) {
    state.lastSeenTime = {};
    await accumulateStock(bot, stock.seed_stock || [], 'SeedStock');
    await accumulateStock(bot, stock.gear_stock || [], 'GearStock');
    updateCachedSection('storeStock', `${state.SeedStock}${state.GearStock}`);
}

async function formatEggStock(stock) {
    state.EggStock = (stock.egg_stock || []).map(e => `${e.display_name} x${e.quantity}`).join('\n');
    if(state.EggStock) state.EggStock += '\n';
    updateCachedSection('storeEggStock', state.EggStock);
}

async function formatEventStock(stock) {
    state.eventStock = (stock.eventshop_stock || []).map(e => `${e.display_name} x${e.quantity}`).join('\n');
    if(state.eventStock) state.eventStock += '\n';
    updateCachedSection('storeEventStock', state.eventStock);
}

async function formatCosmeticStock(stock) {
    const list = Array.isArray(stock.cosmetic_stock) ? stock.cosmetic_stock : [];
    const displayLines = list.map(e => `${e.display_name} x${e.quantity}`);
    state.cosmeticStock = displayLines.join('\n');
    if(state.cosmeticStock) state.cosmeticStock += '\n';

    const canonical = list
        .map(e => {
            const qtyNum = Number(e.quantity);
            return {
                name: (e.display_name || e.name || e.item || '').trim(),
                qty: Number.isFinite(qtyNum) ? qtyNum : 0
            };
        })
        .sort((a,b)=>{
            const n = a.name.localeCompare(b.name);
            if(n !== 0) return n;
            return a.qty - b.qty;
        })
        .map(e => `${e.name} x${e.qty}`)
        .join('\n');

    updateCachedSection('storeCosmeticStock', state.cosmeticStock, canonical);
}

async function formatMerchantStock(stock) {
    const tm = stock?.travelingmerchant_stock;
    if (!tm || !Array.isArray(tm.stock) || !tm.stock.length) {
        updateCachedSection('storeTravelingMerchantStock', '', '');
        return;
    }
    const rawEndUnix = Number(tm.stock[0].end_date_unix) || 0;
    const cutoffUnix = rawEndUnix ? Math.floor(rawEndUnix - 12600) : 0; // timezone adjustment(?), preserving original logic
    const nowUnix = Math.floor(Date.now() / 1000);
    if (!cutoffUnix || nowUnix >= cutoffUnix) {
        updateCachedSection('storeTravelingMerchantStock', '', '');
        return;
    }
    // Sort items deterministically to prevent reorder churn triggering false updates
    const items = (tm.stock || []).map(i => ({
        name: (i.display_name || '').trim(),
        qty: Number.isFinite(i.quantity) ? i.quantity : 0
    })).sort((a,b) => {
        const n = a.name.localeCompare(b.name);
        if (n !== 0) return n;
        return a.qty - b.qty;
    });
    const lines = items.map(i => `${i.name} x${i.qty}`).join('\n');
    const merchantName = tm.merchantName || 'Unknown Merchant';
    const display = [
        `Merchant: ${merchantName}`,
        '',
        'Stock:',
        lines,
        '',
        `Leaves At: <t:${cutoffUnix}:t>`
    ].filter(part => part !== undefined).join('\n');
    state.travelingMerchantStock = display;

    const dayBucket = cutoffUnix ? Math.floor(cutoffUnix / 86400) : 0;
    const canonical = `${merchantName}::${dayBucket}::${lines}`;
    updateCachedSection('storeTravelingMerchantStock', display, canonical);
}

async function formatWeather(body) {
    const list = Array.isArray(body?.weather) ? body.weather : [];
    const nowUnix = Math.floor(Date.now() / 1000);
    const actives = [];
    for (const w of list) {
        if (!w || !w.active) continue;
        const name = w.weather_name || 'Unknown';
        const endUnix = Number(w.end_duration_unix) || 0;
        if (endUnix > nowUnix) {
            const durationSec = endUnix - nowUnix; // remaining duration
            actives.push({ name, endsAtUnix: endUnix, durationSec });
        }
    }
    // Sort deterministically so hash only changes on actual content/time changes, not ordering from API
    actives.sort((a, b) => {
        if (a.endsAtUnix !== b.endsAtUnix) return a.endsAtUnix - b.endsAtUnix;
        return a.name.localeCompare(b.name);
    });
    weatherState.events = actives;
    // No caching: always considered changed by caller logic if needed
    return true;
}

async function formatForeverPack(body) {
    // Example body structure based on provided JSON snippet
    // {
    //   amount: 10,
    //   requestedAmount: 10,
    //   rewards: [ { Name, Price, Image, Tier }, ...],
    //   search: null
    // }
    if(!body || !Array.isArray(body.rewards)) {
        updateCachedSection('storeForeverPackStock', '');
        return;
    }
    // Build a deterministic text block for diffing
    const lines = body.rewards.map(r => `${r.Tier != null ? `T${r.Tier} `: ''}${r.Name} (${r.Price || 0})`).join('\n');
    state.foreverPackStock = lines ? lines + '\n' : '';
    updateCachedSection('storeForeverPackStock', state.foreverPackStock);
}

async function formatAdminMessages(body){
    // Placeholder: capture last 5 messages for potential embed use
    if(!body || !Array.isArray(body.messages)) return;
    state.adminMessages = body.messages.slice(0,5);
}

async function formatStockPrediction(body){
    if(!body) return;
    state.stockPredictionRaw = body; // store raw for later consumption
}


module.exports = {
    formatStock,
    formatEggStock,
    formatEventStock,
    formatCosmeticStock,
    formatMerchantStock,
    formatWeather,
    formatForeverPack,
    formatAdminMessages,
    formatStockPrediction
};