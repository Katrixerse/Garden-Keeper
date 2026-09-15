const express = require('express');
const crypto = require('crypto');
const request = require('node-superfetch');
const router = express.Router();
const { projects } = require('../data');
const { requireApiKey, keyRateLimit, auditLog } = require('../lib/auth');
const config = require('../config.json');
const superagent = require('superagent');
const dayjs = require('dayjs');

let stockState = null; // lazy
let dbConn = null; // lazy
let stockCache = { ts: 0, data: null };
let weatherCache = { ts: 0, data: null };
let foreverpackCache = { ts: 0, data: null };
// Separate cache map for predict endpoint keyed by normalized query params
const predictCache = new Map(); // key -> { ts, data }

// PVB caches
let pvbStockCache = { ts: 0, data: null };
let pvbWeatherCache = { ts: 0, data: null };

// Simple memory usage snapshot

function memorySnapshot() {
  try { const m = process.memoryUsage(); return { rss: m.rss, heapTotal: m.heapTotal, heapUsed: m.heapUsed, external: m.external }; } catch { return {}; }
}

// Projects
router.get('/api/projects', requireApiKey, keyRateLimit(), auditLog, (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const filtered = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)) : projects;
  res.json(filtered.map(({ id, name, tagline, tech, featured }) => ({ id, name, tagline, tech, featured })));
});
router.get('/api/projects/:id', requireApiKey, keyRateLimit(), auditLog, (req, res) => {
  const p = projects.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json(p);
});

// Bot (client injected in server root)
router.get('/garden-keeper/api/bot/status', requireApiKey, keyRateLimit(), auditLog, (req, res) => {
  const clientRef = req.app.get('discordClient');
  if (!clientRef) return res.status(503).json({ error: 'Bot client not attached' });
  res.json({
    online: true,
    uptimeSec: process.uptime(),
    ping: clientRef.ws?.ping ?? null,
    guilds: clientRef.guilds.cache.size,
    usersCached: clientRef.users.cache.size,
    memory: memorySnapshot(),
    readyAt: clientRef.readyAt || null,
    version: clientRef?.version || null,
    hash: crypto.createHash('md5').update(String(process.pid)).digest('hex').slice(0, 8)
  });
});
router.get('/garden-keeper/api/bot/guilds', requireApiKey, keyRateLimit(), auditLog, (req, res) => {
  const clientRef = req.app.get('discordClient');
  if (!clientRef) return res.status(503).json({ error: 'Bot client not attached' });
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const list = clientRef.guilds.cache.map(g => ({ id: g.id, name: g.name, members: g.memberCount })).slice(0, limit);
  res.json(list);
});
router.get('/garden-keeper/api/bot/commands', requireApiKey, keyRateLimit(), auditLog, (req, res) => {
  const clientRef = req.app.get('discordClient');
  if (!clientRef) return res.status(503).json({ error: 'Bot client not attached' });
  const cmds = [];
  clientRef.commands?.forEach((val, key) => {
    cmds.push({
      name: key,
      aliases: clientRef.aliases?.get(key) || [],
      description: clientRef.description?.get(key) || '',
      usage: clientRef.usage?.get(key) || '',
      group: clientRef.group?.get(key) || '',
      cooldown: clientRef.cooldownTime?.get(key) || ''
    });
  });
  res.json(cmds);
});

router.get('/garden-keeper/api/stock/last-seen', requireApiKey, keyRateLimit(), auditLog, async (req, res) => {
  try {
    if (!dbConn) dbConn = require('../bot/Handlers/dbHandlers/dbConnection.js');
    const { conn } = dbConn;
    const search = (req.query.q || '').toString().trim().toLowerCase();
    let rows;
    if (search) {
      [rows] = await conn.promise().query('SELECT stock_name, last_seen FROM last_seen_stock WHERE LOWER(stock_name) LIKE ? ORDER BY last_seen DESC LIMIT 100', [`%${search}%`]);
    } else {
      [rows] = await conn.promise().query('SELECT stock_name, last_seen FROM last_seen_stock ORDER BY last_seen DESC LIMIT 200');
    }
    const now = Math.floor(Date.now() / 1000);
    const freshnessCutoffBase = now - 1200;
    const data = rows.map(r => { const displayTime = r.last_seen + 300; return { name: r.stock_name, lastSeenUnix: displayTime, isNow: freshnessCutoffBase <= displayTime }; });
    res.json({ count: data.length, items: data, generatedAt: Date.now() });
  } catch (e) {
    console.error('API last-seen error:', e);
    res.status(500).json({ error: 'Failed to fetch last seen', detail: e?.message });
  }
});

// Internal proxied Grow a Garden stock (bot -> website)
router.get('/garden-keeper/api/stock', requireApiKey, keyRateLimit(), auditLog, async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 60_000; // 60s cache
    if (!force && stockCache.data && (now - stockCache.ts) < ttlMs) {
      return res.json(stockCache.data);
    }
    const upstream = await superagent
      .get('https://api.joshlei.com/v2/growagarden/stock')
      .set('x-api-key', config.gag_api_key);
    if (!upstream.ok || upstream.status !== 200) return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    stockCache = { ts: now, data: upstream.body };
    res.json(upstream.body);
  } catch (err) {
    console.error('Internal stock proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy stock' });
  }
});

// Internal proxied weather
router.get('/garden-keeper/api/weather', requireApiKey, keyRateLimit(), auditLog, async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 15_000; // 15s cache
    if (!force && weatherCache.data && (now - weatherCache.ts) < ttlMs) {
      return res.json(weatherCache.data);
    }
    const upstream = await superagent
      .get('https://api.joshlei.com/v2/growagarden/weather')
      .set('x-api-key', config.gag_api_key);
    if (!upstream.ok || upstream.status !== 200) return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    weatherCache = { ts: now, data: upstream.body };
    res.json(upstream.body);
  } catch (err) {
    console.error('Internal weather proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy weather' });
  }
});

router.get('/garden-keeper/api/foreverpack', async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 60000 * 60 * 24; // 24h cache
    if (!force && foreverpackCache.data && (now - foreverpackCache.ts) < ttlMs) {
      return res.json(foreverpackCache.data);
    }
    const upstream = await superagent
      .get('https://alpha-v0-lama.3itx.tech/api/v1/Foreverpack')
      .set('x-api-key', config.itx_api_key)
      .query({ amount: 25, find: "Super Seed" });
    if (!upstream.ok || upstream.status !== 200) return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    foreverpackCache = { ts: now, data: upstream.body };
    res.json(upstream.body);
  } catch (err) {
    console.error('Internal foreverpack proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy foreverpack' });
  }
});

router.get('/garden-keeper/api/predict', async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 1000 * 60 * 30; // 30m cache for predictions (shorter than 24h to allow refreshes)

    // Supported query params
    const amountRaw = req.query.amount;
    const search = (req.query.search || req.query.q || '').toString().trim();
    const name = (req.query.name || '').toString().trim();
    const tierMinRaw = req.query.tierMin;
    const tierMaxRaw = req.query.tierMax;

    const amount = Math.min(Math.max(parseInt(amountRaw || '25', 10) || 25, 1), 25); // clamp 1..25
    const tierMin = tierMinRaw !== undefined ? Math.max(0, parseInt(tierMinRaw, 10) || 0) : undefined;
    const tierMax = tierMaxRaw !== undefined ? Math.max(0, parseInt(tierMaxRaw, 10) || 0) : undefined;

    // Build upstream query object only with provided filters
    const upstreamQuery = { amount };
    if (search) upstreamQuery.search = search;
    if (name) upstreamQuery.name = name; // pass through name filter if provided
    if (tierMin !== undefined) upstreamQuery.tierMin = tierMin;
    if (tierMax !== undefined) upstreamQuery.tierMax = tierMax;

    // Normalize cache key
    const cacheKey = JSON.stringify(upstreamQuery);
    const cached = predictCache.get(cacheKey);
    if (!force && cached && (now - cached.ts) < ttlMs) {
      return res.json({ cached: true, params: upstreamQuery, data: cached.data });
    }

    const upstream = await superagent
      .get('https://alpha-v0-lama.3itx.tech/api/v1/Predict')
      .set('x-api-key', config.itx_api_key)
      .query(upstreamQuery);
    if (!upstream.ok || upstream.status !== 200) {
      return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    }
    predictCache.set(cacheKey, { ts: now, data: upstream.body });
    res.json({ cached: false, params: upstreamQuery, data: upstream.body });
  } catch (err) {
    console.error('Internal predict proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy predict' });
  }
});

// PVB API

router.get('/garden-keeper/api/pvb/stock', requireApiKey, keyRateLimit(), auditLog, async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 60_000; // 60s cache
    if (!force && pvbStockCache.data && (now - pvbStockCache.ts) < ttlMs) {
      return res.json(pvbStockCache.data);
    }
    const upstream = await superagent
      .get('https://alpha-v0-lama.3itx.tech/api/v1/pvb/Stock')
      .set('x-api-key', config.itx_api_key);
    if (!upstream.ok || upstream.status !== 200) return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    pvbStockCache = { ts: now, data: upstream.body };
    res.json(upstream.body);
  } catch (err) {
    console.error('Internal stock proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy stock' });
  }
});

router.get('/garden-keeper/api/pvb/weather', requireApiKey, keyRateLimit(), auditLog, async (req, res) => {
  try {
    const now = Date.now();
    const force = 'force' in req.query;
    const ttlMs = 60_000; // 60s cache
    if (!force && pvbWeatherCache.data && (now - pvbWeatherCache.ts) < ttlMs) {
      return res.json(pvbWeatherCache.data);
    }
    const upstream = await superagent
      .get('https://alpha-v0-lama.3itx.tech/api/v1/pvb/Weather')
      .set('x-api-key', config.itx_api_key);
    if (!upstream.ok || upstream.status !== 200) return res.status(upstream.status || 502).json({ error: 'Upstream error', status: upstream.status });
    pvbWeatherCache = { ts: now, data: upstream.body };
    res.json(upstream.body);
  } catch (err) {
    console.error('Internal weather proxy error:', err?.message || err);
    res.status(500).json({ error: 'Failed to proxy weather' });
  }
});

module.exports = router;
