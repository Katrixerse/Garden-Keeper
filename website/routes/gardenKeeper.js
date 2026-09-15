const express = require('express');
const router = express.Router();
const fetch = require('node-superfetch');
const dayjs = require('dayjs');
// DB: reuse bot MySQL pool for website features
let dbPool;
try {
  const db = require('../../bot/Handlers/dbHandlers/dbConnection.js');
  dbPool = db && (db.conn.promise ? db.conn.promise() : db.conn?.promise?.());
} catch (e) { console.warn('[dashboard] DB pool not available:', e?.message||e); }
const { escapeHtml, baseLayout } = require('../util/html');
const config = require('../config.json');


// In-process caches (stock + weather)
let stockCache = { ts:0, built:null, raw:null };
let weatherCache = { ts:0, built:null, raw:null };
let foreverPackCache = { ts:0, built:null, raw:null };
const STOCK_TTL = 60_000; // 60s
const WEATHER_TTL = 30_000; // 30s (weather usually lighter, refresh a bit faster)
const FOREVERPACK_TTL = 60 * 60 * 1_000; // 60 minutes (forever pack rotates daily)
const GK_CLIENT_ID = '1392233576581431327';
const INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${GK_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
const EXTRA_HEAD = '<link rel="stylesheet" href="/public/garden-keeper.css" />';
const SNOWFLAKE_RE = /^[0-9]{5,25}$/;

// Upstream refreshers (server-side proxy with cache)
async function refreshStock(force=false){
  const now = Date.now();
  if(!force && stockCache.built && (now - stockCache.ts) < STOCK_TTL) return stockCache.built;
  try {
    const resp = await fetch
      .get('https://api.joshlei.com/v2/growagarden/stock')
      .set('JStudio-HMAC-Signature', 'jstudio')
      .set('JStudio-HMAC-Timestamp', 'jstudio')
      .set('jstudio-key', config.gag_api_key);
    if(!resp.ok) throw new Error('Upstream stock not OK: '+resp.status);
    stockCache.raw = resp.body;
    stockCache.built = buildPayload(resp.body);
    stockCache.ts = now;
    return stockCache.built;
  } catch(e){
    console.warn('Stock upstream error:', e?.message||e);
    return stockCache.built || null;
  }
}
async function refreshWeather(force=false){
  const now = Date.now();
  if(!force && weatherCache.built && (now - weatherCache.ts) < WEATHER_TTL) return weatherCache.built;
  try {
    const resp = await fetch
      .get('https://api.joshlei.com/v2/growagarden/weather')
      .set('JStudio-HMAC-Signature', 'jstudio')
      .set('JStudio-HMAC-Timestamp', 'jstudio')
      .set('jstudio-key', config.gag_api_key);
    if(!resp.ok) throw new Error('Upstream weather not OK: '+resp.status);
    weatherCache.raw = resp.body;
    weatherCache.built = buildWeatherPayload(resp.body);
    weatherCache.ts = now;
    return weatherCache.built;
  } catch(e){
    console.warn('Weather upstream error:', e?.message||e);
    return weatherCache.built || null;
  }
}

function buildForeverPackPayload(raw){
  if(!raw) return { rewards:[], normalized:[], refreshedAt: Date.now() };
  const rewardsSource = Array.isArray(raw.rewards) ? raw.rewards
    : Array.isArray(raw?.data?.rewards) ? raw.data.rewards
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw?.items) ? raw.items
    : Array.isArray(raw?.payload) ? raw.payload
    : Array.isArray(raw) ? raw
    : [];
  const rewards = rewardsSource.map(entry => {
    if(entry && typeof entry === 'object') return entry;
    return { Name: String(entry ?? 'Unknown'), Tier: null, Price: null };
  });
  const normalized = rewards.map(entry => ({
    name: entry.Name ?? entry.name ?? entry.reward ?? entry.title ?? 'Unknown',
    tier: entry.Tier ?? entry.tier ?? entry.level ?? null,
    price: entry.Price ?? entry.price ?? entry.cost ?? entry.value ?? null,
    raw: entry
  }));
  return {
    rewards,
    normalized,
    original: raw,
    refreshedAt: Date.now()
  };
}

async function refreshForeverPack(force=false){
  const now = Date.now();
  if(!force && foreverPackCache.built && (now - foreverPackCache.ts) < FOREVERPACK_TTL) return foreverPackCache.built;
  if(!config.itx_api_key){
    console.warn('[tracking] Forever Pack API key missing (config.itx_api_key)');
    return foreverPackCache.built;
  }
  try {
    const resp = await fetch
      .get('https://alpha-v0-lama.3itx.tech/api/v1/foreverpack')
      .set('x-api-key', config.itx_api_key)
      .query({ amount: 250 });
    if(!resp.ok) throw new Error('Upstream foreverpack not OK: '+resp.status);
    foreverPackCache.raw = resp.body;
    foreverPackCache.built = buildForeverPackPayload(resp.body);
    foreverPackCache.ts = now;
    return foreverPackCache.built;
  } catch(e){
    console.warn('Forever pack upstream error:', e?.message||e);
    return foreverPackCache.built || null;
  }
}

function nav(req, active){
  const tabs = [
    { key:'overview', label:'Overview', href:'/garden-keeper' },
    { key:'tracking', label:'Tracking', href:'/garden-keeper/tracking' },
    { key:'dashboard', label:'Dashboard', href:'/garden-keeper/dashboard' },
    { key:'status', label:'Status', href:'/garden-keeper/status' }
  ];
  const user = req?.session?.user;
  let authBlock;
  if(user){
    const display = escapeHtml(user.global_name || user.username);
    const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    authBlock = `<div class="gk-user">\n <img class="gk-avatar" src="${avatarUrl}" alt="avatar" loading="lazy" />\n <span class="gk-username">${display}</span>\n <button type="button" class="gk-btn small outline" id="logoutBtn" title="Logout">Logout</button>\n</div>`;
  } else {
    authBlock = `<a class="gk-btn" href="/garden-keeper/auth/discord" title="Login with Discord">Login</a>`;
  }
  return `<header class="gk-header"><div class="gk-header-inner">
    <div class="gk-brand"><span class="gk-logo">🌱</span> <span>Garden Keeper</span></div>
    <nav class="gk-nav-tabs">${tabs.map(t=>`<a class="gk-tab ${t.key===active?'active':''}" href="${t.href}">${escapeHtml(t.label)}</a>`).join('')}</nav>
    <div class="gk-cta-group">
      <a class="gk-btn primary" href="${INVITE_URL}" target="_blank" rel="noopener">Invite Bot</a>
      <a class="gk-btn" href="/projects" rel="noopener">Portfolio</a>
      ${authBlock}
    </div>
  </div></header>`;
}

function formatList(arr){
  return Array.isArray(arr)?arr.map(o=>`${o.display_name||o.name||o.item||'Unknown'} x${o.quantity||o.qty||o.count||1}`).join('\n'):'';
}
function formatMerchant(merch){
  if(!merch||!Array.isArray(merch.stock)||!merch.stock.length) return '';
  const lines = formatList(merch.stock);
  const cutoffUnix = merch.stock[0]?.end_date_unix ? (merch.stock[0].end_date_unix - 12600) : null;
  const timeLine = cutoffUnix ? `\nLeaves At: ${dayjs.unix(Math.floor(cutoffUnix)).format('MMMM D, YYYY h:mm A')}` : '';
  return `Merchant: ${merch.merchantName || 'Unknown'}\nStock:\n${lines}${timeLine}`;
}
function buildPayload(raw){
  if(!raw) return null; const src = raw.stock || raw; const merch = src.travelingmerchant_stock; let merchantLeavesAt=null; if(merch && Array.isArray(merch.stock) && merch.stock[0]?.end_date_unix){ merchantLeavesAt = merch.stock[0].end_date_unix - 12600; }
  return {
    seedStock: formatList(src.seed_stock),
    gearStock: formatList(src.gear_stock),
    eggStock: formatList(src.egg_stock),
    eventStock: formatList(src.eventshop_stock),
    cosmeticStock: formatList(src.cosmetic_stock),
    merchantStock: formatMerchant(merch),
    merchantLeavesAt,
    refreshedAt: Date.now()
  }; }

// Weather helpers
function buildWeatherPayload(raw){
  if(!raw) return { events:[], refreshedAt: Date.now() };
  const list = Array.isArray(raw.weather) ? raw.weather : [];
  const nowUnix = Math.floor(Date.now()/1000);
  const seen = new Set();
  const events = [];
  for(const e of list){
    if(!e || e.active !== true) continue;
    const name = e.weather_name || e.name || 'Unknown';
    const rawEnd = Number(e.end_duration_unix || e.end_time || e.ends_at || 0);
    let endUnix = Number.isFinite(rawEnd) && rawEnd > 0 ? rawEnd : 0;
    if(endUnix <= nowUnix){
      const duration = Number(e.duration || e.remaining_duration || 0);
      if(Number.isFinite(duration) && duration > 0){
        endUnix = nowUnix + Math.round(duration);
      }
    }
    if(!Number.isFinite(endUnix) || endUnix <= nowUnix) continue;
    const key = `${name}:${endUnix}`;
    if(seen.has(key)) continue;
    seen.add(key);
    events.push({
      name,
      durationSec: endUnix - nowUnix,
      endsAtUnix: endUnix,
      raw: e
    });
  }
  events.sort((a,b)=>{
    if(a.endsAtUnix !== b.endsAtUnix) return a.endsAtUnix - b.endsAtUnix;
    return a.name.localeCompare(b.name);
  });
  return { events, refreshedAt: Date.now() };
}



// ---------------------------
// Dashboard helpers (use existing MySQL tables)
// Tables: guildPrefix, guildSettings, guildStockChannels
// ---------------------------
function defaultsForGuild(gid){
  const guildId = SNOWFLAKE_RE.test(String(gid)) ? String(gid) : '';
  return {
    guildId,
    prefix: '!',
    leveling: false,
    rolePersist: false,
    modLogsEnabled: false,
    chatLogsEnabled: false,
    modLogsChannelId: '',
    chatLogsChannelId: '',
    serverCash: false,
    modOnlyCommands: false,
    serverStats: false,
    serverCaptcha: false,
    disabledEvents: '',
    stockChannelId: '',
    eggChannelId: '',
    eventChannelId: '',
    merchantChannelId: '',
    cosmeticsChannelId: '',
    weatherChannelId: ''
  };
}

async function getGuildSettings(guildId){
  const gid = SNOWFLAKE_RE.test(String(guildId)) ? String(guildId) : '';
  if(!gid) return defaultsForGuild(guildId);
  if(!dbPool) return defaultsForGuild(gid);
  const out = defaultsForGuild(gid);
  const toBool = (v)=>!!Number(v || 0);
  try {
    // Prefix
  const [pRows] = await dbPool.execute('SELECT prefix FROM guildPrefix WHERE guildId = ?', [gid]);
    if (pRows && pRows.length) out.prefix = pRows[0].prefix || out.prefix;

    // Server settings (leveling + logging channel)
    const [sRows] = await dbPool.execute(`
      SELECT modLogsEnabled, chatLogsEnabled, modLogsChannel, chatLogsChannel, rolePersist, serverLevels,
             ServerCash, modOnlyCommands, disabledEvents, serverStats, serverCaptcha
      FROM guildSettings WHERE guildId = ?
    `, [gid]);
    if (sRows && sRows.length) {
      const row = sRows[0];
      out.leveling = toBool(row.serverLevels);
      out.rolePersist = toBool(row.rolePersist);
      out.modLogsEnabled = toBool(row.modLogsEnabled);
      out.chatLogsEnabled = toBool(row.chatLogsEnabled);
      out.serverCash = toBool(row.ServerCash);
      out.modOnlyCommands = toBool(row.modOnlyCommands);
      out.serverStats = toBool(row.serverStats);
      out.serverCaptcha = toBool(row.serverCaptcha);
      out.modLogsChannelId = row.modLogsChannel || '';
      out.chatLogsChannelId = row.chatLogsChannel || '';
      out.disabledEvents = row.disabledEvents || '';
    }

    // Stock channel
    const [cRows] = await dbPool.execute(`
      SELECT stockChannelId, eggChannelId, eventChannelId, merchantChannelId, cosmeticsChannelId, weatherChannelId
      FROM guildStockChannels WHERE guildId = ?
    `, [gid]);
    if (cRows && cRows.length) {
      const row = cRows[0];
      out.stockChannelId = row.stockChannelId || '';
      out.eggChannelId = row.eggChannelId || '';
      out.eventChannelId = row.eventChannelId || '';
      out.merchantChannelId = row.merchantChannelId || '';
      out.cosmeticsChannelId = row.cosmeticsChannelId || '';
      out.weatherChannelId = row.weatherChannelId || '';
    }

    return out;
  } catch(e){
    console.warn('[dashboard] getGuildSettings error:', e?.message||e);
    return out;
  }
}

async function upsertGuildSettings(settings){
  if(!dbPool) return false;
  const gid = SNOWFLAKE_RE.test(String(settings.guildId)) ? String(settings.guildId) : '';
  if(!gid) return false;
  const prefix = String(settings.prefix||'!').slice(0,3);
  const bool = (v)=>v ? 1 : 0;
  const leveling = bool(settings.leveling);
  const rolePersist = bool(settings.rolePersist);
  const modLogsEnabled = bool(settings.modLogsEnabled);
  const chatLogsEnabled = bool(settings.chatLogsEnabled);
  const serverCash = bool(settings.serverCash);
  const modOnlyCommands = bool(settings.modOnlyCommands);
  const serverStats = bool(settings.serverStats);
  const serverCaptcha = bool(settings.serverCaptcha);
  const modLogsChannelId = String(settings.modLogsChannelId||'').trim();
  const chatLogsChannelId = String(settings.chatLogsChannelId||'').trim();
  const disabledEvents = String(settings.disabledEvents||'').trim().slice(0, 500);
  const stockId = String(settings.stockChannelId||'').trim();
  const eggId = String(settings.eggChannelId||'').trim();
  const eventId = String(settings.eventChannelId||'').trim();
  const merchantId = String(settings.merchantChannelId||'').trim();
  const cosmeticsId = String(settings.cosmeticsChannelId||'').trim();
  const weatherId = String(settings.weatherChannelId||'').trim();
  try {
    // guildPrefix
    await dbPool.execute(
      'INSERT INTO guildPrefix (guildId, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix = VALUES(prefix)',
      [gid, prefix]
    );

    // guildSettings (serverLevels + modLogsChannel)
    await dbPool.execute(
      `INSERT INTO guildSettings (
          guildId, modLogsEnabled, chatLogsEnabled, modLogsChannel, chatLogsChannel,
          rolePersist, serverLevels, ServerCash, modOnlyCommands, disabledEvents,
          serverStats, serverCaptcha
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          modLogsEnabled = VALUES(modLogsEnabled),
          chatLogsEnabled = VALUES(chatLogsEnabled),
          modLogsChannel = VALUES(modLogsChannel),
          chatLogsChannel = VALUES(chatLogsChannel),
          rolePersist = VALUES(rolePersist),
          serverLevels = VALUES(serverLevels),
          ServerCash = VALUES(ServerCash),
          modOnlyCommands = VALUES(modOnlyCommands),
          disabledEvents = VALUES(disabledEvents),
          serverStats = VALUES(serverStats),
          serverCaptcha = VALUES(serverCaptcha)
      `,
      [
        gid,
        modLogsEnabled,
        chatLogsEnabled,
        modLogsChannelId,
        chatLogsChannelId,
        rolePersist,
        leveling,
        serverCash,
        modOnlyCommands,
        disabledEvents,
        serverStats,
        serverCaptcha
      ]
    );

    // guildStockChannels (stockChannelId)
    await dbPool.execute(
      `INSERT INTO guildStockChannels (
          guildId, stockChannelId, eggChannelId, eventChannelId, merchantChannelId, cosmeticsChannelId, weatherChannelId
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          stockChannelId = VALUES(stockChannelId),
          eggChannelId = VALUES(eggChannelId),
          eventChannelId = VALUES(eventChannelId),
          merchantChannelId = VALUES(merchantChannelId),
          cosmeticsChannelId = VALUES(cosmeticsChannelId),
          weatherChannelId = VALUES(weatherChannelId)
      `,
      [gid, stockId, eggId, eventId, merchantId, cosmeticsId, weatherId]
    );

    return true;
  } catch(e){
    console.warn('[dashboard] upsertGuildSettings error:', e?.message||e);
    return false;
  }
}
const { getGuilds, setGuilds } = require('../lib/oauthCache');
async function fetchUserGuilds(req){
  const token = req.session?.accessToken; if(!token) return { ok:false, error:'Not authenticated', guilds:[] };
  try {
    // Cache check
    const cached = getGuilds(token);
    let list;
    if(cached){
      list = cached;
    } else {
      const r = await fetch.get('https://discord.com/api/users/@me/guilds').set('Authorization', `Bearer ${token}`);
      if(!r.ok) return { ok:false, error:`Discord returned ${r.status}`, guilds:[] };
      list = Array.isArray(r.body)? r.body : [];
      setGuilds(token, list, 120_000); // 2 minutes
    }
  // Only keep servers the user can manage: owner OR has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8)
  const toBig = (v)=>{ try { return typeof v === 'string' ? BigInt(v) : BigInt(Number(v||0)); } catch { return BigInt(0); } };
  const manageable = list.filter(g => g?.owner === true || (toBig(g?.permissions) & BigInt(0x20)) === BigInt(0x20) || (toBig(g?.permissions) & BigInt(0x8)) === BigInt(0x8));
  return { ok:true, guilds: manageable };
  } catch(e){ return { ok:false, error:e?.message||'Guilds fetch failed', guilds:[] }; }
}
function requireLogin(req,res,next){ if(!req.session?.user) return res.redirect(302, '/garden-keeper/auth/discord'); next(); }

function canManageGuild(g){
  if(!g) return false;
  if(g.owner === true) return true;
  const toBig = (v)=>{ try { return typeof v === 'string' ? BigInt(v) : BigInt(Number(v||0)); } catch { return BigInt(0); } };
  const perms = toBig(g.permissions);
  // ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20)
  return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
}

function renderDashboardHome(req, guilds, message){
  const cards = guilds.map(g=>{
    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    let permHex = '0';
    try {
      const big = typeof g.permissions === 'string' ? BigInt(g.permissions) : BigInt(g.permissions || 0);
      permHex = big.toString(16).toUpperCase();
    } catch { permHex = String(g.permissions || '0'); }
    return `<div class="gk-card gk-guild-card" data-guild-name="${escapeHtml(g.name.toLowerCase())}">
      <div class="gk-card-head"><h3>${escapeHtml(g.name)}</h3><span class="muted small">${g.owner ? 'Owner' : 'Manage Access'}</span></div>
      <div class="gk-card-body">
        <div class="gk-guild-row"><img src="${icon}" alt="icon" width="48" height="48" class="gk-guild-icon" loading="lazy"/>
        <div>
          <div class="muted small">ID: ${g.id}</div>
          <div class="muted small">Permissions: 0x${permHex}</div>
        </div></div>
        <div class="gk-actions" style="margin-top:1rem"><a class="gk-btn" href="/garden-keeper/dashboard/${g.id}">Manage</a></div>
      </div>
    </div>`;
  }).join('') || '<div class="gk-card"><div class="gk-card-body"><p>No manageable servers found. Ensure the OAuth scope includes "guilds" and you have Manage Server permission.</p></div></div>';
  const total = guilds.length;
  const body = `${nav(req,'dashboard')}
  <section class="gk-hero compact"><div class="gk-hero-text"><h1>Dashboard</h1><p class="lead">Manage Garden Keeper settings for your servers.</p></div></section>
  <div class="gk-tracking-wrap"><section class="gk-tracking-sub">
    <div class="gk-dashboard-controls">
      <div class="gk-card gk-stat-card"><div class="gk-card-head"><h3>Manageable Servers</h3></div><div class="gk-card-body">
        <div class="gk-stat-value">${total}</div>
        <div class="muted small">You can configure these servers directly.</div>
      </div></div>
      <div class="gk-card gk-search-card"><div class="gk-card-head"><h3>Search</h3></div><div class="gk-card-body">
        <input id="guildSearch" type="search" placeholder="Filter by server name" aria-label="Search manageable servers" />
        ${message?`<p class="muted small" style="margin-top:.5rem">${escapeHtml(message)}</p>`:''}
      </div></div>
    </div>
    <div class="gk-stock-grid gk-guild-grid">${cards}</div>
  </section></div>`;
  return baseLayout({ title:'Garden Keeper • Dashboard', description:'Manage your servers', body, extraHead: EXTRA_HEAD });
}

function renderGuildSettings(req, guild, settings){
  const body = `${nav(req,'dashboard')}
  <section class="gk-hero compact"><div class="gk-hero-text"><h1>${escapeHtml(guild?.name||'Server')}</h1><p class="lead">Configure bot settings for this server.</p></div></section>
  <div class="gk-tracking-wrap"><section class="gk-tracking-sub">
    <div class="gk-settings-grid">
      <div class="gk-card"><div class="gk-card-head"><h3>General</h3><p class="muted small">Core automation and quality-of-life toggles.</p></div><div class="gk-card-body">
        <div class="gk-form-grid">
          <div class="gk-field">
            <label>Prefix
              <input id="setPrefix" type="text" value="${escapeHtml(settings.prefix||'!')}" maxlength="3" />
            </label>
            <small class="muted">Command prefix (max 3 characters).</small>
          </div>
          <div class="gk-field">
            <label>Leveling
              <select id="setLeveling"><option value="true"${settings.leveling?' selected':''}>Enabled</option><option value="false"${!settings.leveling?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Enable XP tracking and level roles.</small>
          </div>
          <div class="gk-field">
            <label>Role Persist
              <select id="setRolePersist"><option value="true"${settings.rolePersist?' selected':''}>Enabled</option><option value="false"${!settings.rolePersist?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Re-apply saved roles when members return.</small>
          </div>
          <div class="gk-field">
            <label>Server Stats
              <select id="setServerStats"><option value="true"${settings.serverStats?' selected':''}>Enabled</option><option value="false"${!settings.serverStats?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Update server statistics channels.</small>
          </div>
          <div class="gk-field">
            <label>Server Cash
              <select id="setServerCash"><option value="true"${settings.serverCash?' selected':''}>Enabled</option><option value="false"${!settings.serverCash?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Allow economy cash generation.</small>
          </div>
          <div class="gk-field">
            <label>Mod-Only Commands
              <select id="setModOnly"><option value="true"${settings.modOnlyCommands?' selected':''}>Enabled</option><option value="false"${!settings.modOnlyCommands?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Restrict sensitive commands to moderators.</small>
          </div>
          <div class="gk-field">
            <label>Server Captcha
              <select id="setServerCaptcha"><option value="true"${settings.serverCaptcha?' selected':''}>Enabled</option><option value="false"${!settings.serverCaptcha?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Require captcha challenges for new members.</small>
          </div>
        </div>
      </div></div>

      <div class="gk-card"><div class="gk-card-head"><h3>Logging</h3><p class="muted small">Choose channels for automated moderation and chat logs.</p></div><div class="gk-card-body">
        <div class="gk-form-grid">
          <div class="gk-field">
            <label>Mod Logs
              <select id="setModLogsEnabled"><option value="true"${settings.modLogsEnabled?' selected':''}>Enabled</option><option value="false"${!settings.modLogsEnabled?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Tracks moderation actions (warns, bans, etc.).</small>
          </div>
          <div class="gk-field">
            <label>Mod Logs Channel ID
              <input id="setModLogsChannel" type="text" value="${escapeHtml(settings.modLogsChannelId||'')}" placeholder="123456789012345678" />
            </label>
          </div>
          <div class="gk-field">
            <label>Chat Logs
              <select id="setChatLogsEnabled"><option value="true"${settings.chatLogsEnabled?' selected':''}>Enabled</option><option value="false"${!settings.chatLogsEnabled?' selected':''}>Disabled</option></select>
            </label>
            <small class="muted">Mirror message edits/deletes into a channel.</small>
          </div>
          <div class="gk-field">
            <label>Chat Logs Channel ID
              <input id="setChatLogsChannel" type="text" value="${escapeHtml(settings.chatLogsChannelId||'')}" placeholder="123456789012345678" />
            </label>
          </div>
        </div>
      </div></div>

      <div class="gk-card"><div class="gk-card-head"><h3>Announcement Channels</h3><p class="muted small">Override where automated stock alerts are delivered.</p></div><div class="gk-card-body">
        <div class="gk-form-grid">
          <div class="gk-field"><label>Core Stock Channel ID
            <input id="setStockChannel" type="text" value="${escapeHtml(settings.stockChannelId||'')}" /></label></div>
          <div class="gk-field"><label>Egg Stock Channel ID
            <input id="setEggChannel" type="text" value="${escapeHtml(settings.eggChannelId||'')}" /></label></div>
          <div class="gk-field"><label>Event Stock Channel ID
            <input id="setEventChannel" type="text" value="${escapeHtml(settings.eventChannelId||'')}" /></label></div>
          <div class="gk-field"><label>Merchant Channel ID
            <input id="setMerchantChannel" type="text" value="${escapeHtml(settings.merchantChannelId||'')}" /></label></div>
          <div class="gk-field"><label>Cosmetics Channel ID
            <input id="setCosmeticsChannel" type="text" value="${escapeHtml(settings.cosmeticsChannelId||'')}" /></label></div>
          <div class="gk-field"><label>Weather Channel ID
            <input id="setWeatherChannel" type="text" value="${escapeHtml(settings.weatherChannelId||'')}" /></label></div>
        </div>
      </div></div>
      
    </div>
    <div class="gk-actions settings-actions">
      <button class="gk-btn" id="saveGuildSettings" data-gid="${guild.id}">Save Changes</button>
      <a class="gk-btn outline" href="/garden-keeper/dashboard">Back</a>
    </div>
  </section></div>
  <script src="/public/gk-dashboard.js" defer></script>`;
  return baseLayout({ title:`Garden Keeper • ${guild?.name||'Server'} Settings`, description:'Guild settings', body, extraHead: EXTRA_HEAD });
}

// Unified tracking page (Stock + Merchant + Weather)
function renderTrackingPage(req, stockData, weatherData){
  const block = (title, content) => `<div class="gk-card stock-block"><div class="gk-card-head"><h3>${escapeHtml(title)}</h3></div><pre class="gk-pre">${escapeHtml(content||'no new data')}</pre></div>`;
  const stockSection = stockData ? `
  <section class="gk-tracking-sub gk-tab-panel active" id="stockSection" data-tab-panel="stock">
    <div class="gk-sub-head">
      <h2>Stock</h2>
      <div class="gk-actions">
        <button class="gk-btn small" id="stockManualRefresh">Refresh</button>
        <button class="gk-btn small outline" id="stockToggleAuto">Pause</button>
      </div>
      <div class="gk-refresh-meta">Next auto in <span id="stockCountdown">60</span>s • <span id="stockRefreshedAt" data-refreshed-ts="${stockData.refreshedAt}">Refreshed at ${new Date(stockData.refreshedAt).toLocaleTimeString()}</span></div>
    </div>
    <div class="gk-stock-grid">
      ${block('Seed Stock', stockData.seedStock)}
      ${block('Gear Stock', stockData.gearStock)}
      ${block('Egg Stock', stockData.eggStock)}
      ${block('Event Stock', stockData.eventStock)}
      ${block('Cosmetics', stockData.cosmeticStock)}
    </div>
  </section>` : `<section class="gk-tracking-sub gk-tab-panel active" id="stockSection" data-tab-panel="stock"><h2>Stock</h2><p>No stock data available.</p></section>`;
  const merchantSection = stockData ? `
  <section class="gk-tracking-sub gk-tab-panel" id="merchantSection" data-tab-panel="merchant">
    <div class="gk-sub-head">
      <h2>Merchant</h2>
      <div class="gk-actions">
        <button class="gk-btn small" id="merchantManualRefresh">Refresh</button>
        <button class="gk-btn small outline" id="merchantToggleAuto">Pause</button>
      </div>
      <div class="gk-refresh-meta">Next auto in <span id="merchantCountdown">60</span>s • <span id="merchantRefreshedAt" data-refreshed-ts="${stockData.refreshedAt}">Refreshed at ${new Date(stockData.refreshedAt).toLocaleTimeString()}</span></div>
    </div>
    <div class="gk-stock-grid merchant-grid">
      <div class="gk-card stock-block"><div class="gk-card-head"><h3>Traveling Merchant</h3></div><pre class="gk-pre" id="merchantPre" ${stockData.merchantLeavesAt?`data-merchant-end="${stockData.merchantLeavesAt}"`:''}>${escapeHtml(stockData.merchantStock || 'no merchant')}</pre></div>
    </div>
  </section>` : `<section class="gk-tracking-sub gk-tab-panel" id="merchantSection" data-tab-panel="merchant"><h2>Merchant</h2><p>No merchant data available.</p></section>`;
  const foreverSection = `
  <section class="gk-tracking-sub gk-tab-panel" id="foreverpackSection" data-tab-panel="foreverpack">
    <div class="gk-sub-head">
      <h2>Forever Pack</h2>
      <div class="gk-actions">
        <button class="gk-btn small" id="foreverManualRefresh">Refresh</button>
        <button class="gk-btn small outline" id="foreverToggleAuto">Pause</button>
      </div>
      <div class="gk-refresh-meta">Next auto in <span id="foreverCountdown">600</span>s • <span id="foreverRefreshedAt" data-refreshed-ts="">Waiting for first refresh…</span></div>
    </div>
    <div class="gk-stock-grid">
      <div class="gk-card stock-block"><div class="gk-card-head"><h3>Rewards</h3></div><pre class="gk-pre" id="foreverPre">loading…</pre></div>
    </div>
  </section>`;
  const predictionSection = `
  <section class="gk-tracking-sub gk-tab-panel" id="predictionSection" data-tab-panel="prediction">
    <div class="gk-sub-head">
      <h2>Predicted Stock</h2>
      <div class="gk-actions">
        <button class="gk-btn small" id="predictionManualRefresh">Refresh</button>
        <button class="gk-btn small outline" id="predictionToggleAuto">Pause</button>
      </div>
      <div class="gk-refresh-meta">Next auto in <span id="predictionCountdown">900</span>s • <span id="predictionRefreshedAt" data-refreshed-ts="">Waiting for first refresh…</span></div>
    </div>
    <div class="gk-stock-grid">
      <div class="gk-card stock-block"><div class="gk-card-head"><h3>Forecast</h3></div><pre class="gk-pre" id="predictionPre">loading…</pre></div>
    </div>
  </section>`;
  const weatherSection = (()=>{
  if(!weatherData) return '<section class="gk-tracking-sub gk-tab-panel" id="weatherSection" data-tab-panel="weather"><h2>Weather</h2><p>No weather data available.</p></section>';
    const events = weatherData.events||[];
    const cards = events.length
      ? events.map(ev => `
        <div class="gk-card weather-item" data-ends-unix="${ev.endsAtUnix}">
          <div class="gk-card-head"><h3>${escapeHtml(ev.name)}</h3></div>
          <div class="gk-card-body">
            <p class="meta">Ends at: <span class="end-time" data-end="${ev.endsAtUnix}"><t:${ev.endsAtUnix}:t></span></p>
            <p class="countdown" data-end="${ev.endsAtUnix}">Calculating...</p>
          </div>
        </div>`).join('')
      : '<div class="gk-card"><p>No active weather events.</p></div>';
    return `
    <section class="gk-tracking-sub gk-tab-panel" id="weatherSection" data-tab-panel="weather">
      <div class="gk-sub-head">
        <h2>Weather</h2>
        <div class="gk-actions">
          <button class="gk-btn small" id="weatherManualRefresh">Refresh</button>
          <button class="gk-btn small outline" id="weatherToggleAuto">Pause</button>
        </div>
        <div class="gk-refresh-meta">Next auto in <span id="weatherCountdown">30</span>s • <span id="weatherRefreshedAt" data-refreshed-ts="${weatherData.refreshedAt}">Refreshed at ${new Date(weatherData.refreshedAt).toLocaleTimeString()}</span></div>
      </div>
      <div class="gk-stock-grid weather-grid">${cards}</div>
    </section>`;
  })();
  const tabs = `
    <nav class="gk-track-tabs" id="trackingTabs" aria-label="Tracking datasets">
      <button type="button" class="gk-track-tab active" data-tab-button="stock">Stock</button>
      <button type="button" class="gk-track-tab" data-tab-button="merchant">Merchant</button>
      <button type="button" class="gk-track-tab" data-tab-button="weather">Weather</button>
      <button type="button" class="gk-track-tab" data-tab-button="foreverpack">Forever Pack</button>
      <button type="button" class="gk-track-tab" data-tab-button="prediction">Predicted Stock</button>
    </nav>`;
  const body = `${nav(req,'tracking')}
  <section class="gk-hero compact">
    <div class="gk-hero-text"><h1>Tracking</h1><p class="lead">Unified live Grow a Garden data: stock, merchant, weather, forever pack & predictions.</p></div>
  </section>
  <div class="gk-tracking-wrap">${tabs}${stockSection}${merchantSection}${weatherSection}${foreverSection}${predictionSection}</div>
  <script src="/public/gk-tracking.js" defer></script>`;
  return baseLayout({ title:'Garden Keeper • Tracking', description:'Unified Grow a Garden stock, merchant, weather, forever pack & prediction tracking', body, extraHead: EXTRA_HEAD, image:'/public/og-gardenkeeper.png' });
}

// Overview page
router.get('/garden-keeper', (req,res)=>{
  const features = [
  { icon:'📦', title:'Stock + Merchant', desc:'Real-time inventory with merchant timing.' },
  { icon:'⛅', title:'Weather Events', desc:'Active events with live countdown timers.' },
    { icon:'📊', title:'Bot Status', desc:'Observe uptime, latency & operational stats.' },
    { icon:'🔑', title:'API Endpoints', desc:'Secure JSON endpoints for integrations.' },
    { icon:'🎉', title:'Giveaways', desc:'Scheduled & button-driven giveaways.' },
    { icon:'🛡️', title:'Moderation Suite', desc:'Warnings, mutes, bans & more.' }
  ];
  const body = `${nav(req,'overview')}
    <section class=\"gk-hero\">\n    <div class=\"gk-hero-content\">\n      <h1>Garden Keeper</h1>\n      <p class=\"lead\">Monitor Grow a Garden. Automate your server. Deliver insights fast.</p>\n      <div class=\"gk-hero-cta\">\n        <a class=\"gk-btn primary large\" href=\"${INVITE_URL}\" target=\"_blank\" rel=\"noopener\">Invite Bot</a>\n        <a class=\"gk-btn large\" href=\"/garden-keeper/tracking\">Tracking</a>\n      </div>\n      <p class=\"gk-meta small\">Client ID: <code>${escapeHtml(GK_CLIENT_ID)}</code></p>\n    </div>\n    <div class=\"gk-hero-accent\"></div>\n  </section>
  <section class=\"gk-features\">${features.map(f=>`<div class=\\"gk-card feature\\"><div class=\\"icon\\">${f.icon}</div><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.desc)}</p></div>`).join('')}</section>
  <section class=\"gk-callout\">
    <h2>Ready to grow?</h2>
    <p>Add Garden Keeper now or explore the live stock feed.</p>
    <div class=\"gk-hero-cta\">
      <a class=\"gk-btn primary\" href=\"${INVITE_URL}\" target=\"_blank\" rel=\"noopener\">Invite</a>
      <a class=\"gk-btn outline\" href=\"/garden-keeper/tracking\">Tracking</a>
    </div>
  </section>`;
  res.send(baseLayout({ title:'Garden Keeper • Overview', description:'Dashboard for the Garden Keeper Discord bot', body, extraHead: EXTRA_HEAD, image:'/public/og-gardenkeeper.png' }));
});



// Public stock/weather endpoints for the tracking page client script
router.get('/garden-keeper/api/stock', async (req,res)=>{
  const force = 'force' in req.query;
  const data = await refreshStock(force);
  res.json(stockCache.raw || {});
});
router.get('/garden-keeper/api/weather', async (req,res)=>{
  const force = 'force' in req.query;
  const data = await refreshWeather(force);
  res.json(weatherCache.raw || {});
});
router.get('/garden-keeper/api/foreverpack', async (req,res)=>{
  const force = 'force' in req.query;
  const built = await refreshForeverPack(force);
  if(!built){
    return res.status(503).json({ error:'Forever Pack unavailable right now' });
  }
  res.json(built);
});

// Unified tracking route
router.get('/garden-keeper/tracking', async (req,res)=>{
  const force = 'force' in req.query;
  const [s,w] = await Promise.all([refreshStock(force), refreshWeather(force)]);
  res.send(renderTrackingPage(req,s,w));
});

// ---------------------------
// Dashboard routes
// ---------------------------
router.get('/garden-keeper/dashboard', requireLogin, async (req,res)=>{
  const { ok, error, guilds } = await fetchUserGuilds(req);
  const manageable = (ok?guilds:[]).filter(g=>SNOWFLAKE_RE.test(String(g?.id))); // already filtered in fetchUserGuilds; keep for clarity
  res.send(renderDashboardHome(req, manageable, error||null));
});

router.get('/garden-keeper/dashboard/:guildId/settings', requireLogin, async (req,res)=>{
  const { guildId } = req.params;
  if(!SNOWFLAKE_RE.test(String(guildId))) return res.status(400).json({ ok:false, error:'Invalid guild ID' });
  try {
    const { ok, guilds } = await fetchUserGuilds(req);
    const g = (ok?guilds:[]).find(x=>x.id===guildId);
    if(!g || !canManageGuild(g)) {
      return res.status(403).json({ ok:false, error:'Forbidden' });
    }
    const settings = await getGuildSettings(guildId);
    return res.json({ ok:true, guild:{ id:g.id, name:g.name, owner:g.owner === true }, settings });
  } catch (err) {
    console.error('[dashboard] settings fetch failed:', err?.message||err);
    return res.status(500).json({ ok:false, error:'Failed to load settings' });
  }
});

router.get('/garden-keeper/dashboard/:guildId', requireLogin, async (req,res)=>{
  const { guildId } = req.params;
  if(!SNOWFLAKE_RE.test(String(guildId))) return res.status(400).send('Invalid guild ID');
  const { ok, guilds } = await fetchUserGuilds(req);
  const g = (ok?guilds:[]).find(x=>x.id===guildId);
  if(!g || !canManageGuild(g)) return res.status(403).send('Forbidden: missing Manage Server permission');
  const settings = await getGuildSettings(guildId);
  res.send(renderGuildSettings(req, g, settings));
});

router.post('/garden-keeper/dashboard/:guildId', requireLogin, express.json(), async (req,res)=>{
  const { guildId } = req.params;
  if(!SNOWFLAKE_RE.test(String(guildId))) return res.status(400).json({ error:'Invalid guild ID' });
  const body = req.body || {};
  const { ok: okGuilds, guilds } = await fetchUserGuilds(req);
  const g = (okGuilds?guilds:[]).find(x=>x.id===guildId);
  if(!g || !canManageGuild(g)) return res.status(403).json({ error:'Forbidden' });
  const bool = (v)=>{
    if(typeof v === 'string'){
      const lower = v.toLowerCase();
      return ['true','1','on','yes','enabled'].includes(lower);
    }
    return v === true || v === 1;
  };
  const next = {
    guildId,
    prefix: String(body.prefix||'!').slice(0,3),
    leveling: bool(body.leveling),
    rolePersist: bool(body.rolePersist),
    serverStats: bool(body.serverStats),
    serverCash: bool(body.serverCash),
    modOnlyCommands: bool(body.modOnlyCommands),
    serverCaptcha: bool(body.serverCaptcha),
    modLogsEnabled: bool(body.modLogsEnabled),
    modLogsChannelId: String(body.modLogsChannelId||'').trim(),
    chatLogsEnabled: bool(body.chatLogsEnabled),
    chatLogsChannelId: String(body.chatLogsChannelId||'').trim(),
    stockChannelId: String(body.stockChannelId||'').trim(),
    eggChannelId: String(body.eggChannelId||'').trim(),
    eventChannelId: String(body.eventChannelId||'').trim(),
    merchantChannelId: String(body.merchantChannelId||'').trim(),
    cosmeticsChannelId: String(body.cosmeticsChannelId||'').trim(),
    weatherChannelId: String(body.weatherChannelId||'').trim(),
    disabledEvents: String(body.disabledEvents||'').trim()
  };
  const ok = await upsertGuildSettings(next);
  if(!ok) return res.status(500).json({ error:'Failed to save settings' });
  res.json({ success:true, settings: next });
});

module.exports = router;
