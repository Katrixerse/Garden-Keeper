const { conn } = require('../dbHandlers/dbConnection');

// Seed definitions: growth phases (minutes), base reward, rarity tier, baseCost for shop
// Rarity order: common < uncommon < rare < epic < legendary < mythic
const SEED_TYPES = {
  Carrot: { phases: [10, 20, 30], reward: 50, rarity: 'common', baseCost: 10 },
  Strawberry: { phases: [5, 10, 15], reward: 30, rarity: 'common', baseCost: 50 },
  Blueberry: { phases: [20, 30, 40], reward: 120, rarity: 'uncommon', baseCost: 400 },
  OrangeTulip: { phases: [60, 60, 60], reward: 500, rarity: 'uncommon', baseCost: 600 },
  Tomato: { phases: [15, 25, 35], reward: 70, rarity: 'rare', baseCost: 800 },
  Corn: { phases: [25, 35, 45], reward: 95, rarity: 'rare', baseCost: 1300 },
  Daffodil: { phases: [25, 35, 45], reward: 90, rarity: 'rare', baseCost: 1000 },
  Watermelon: { phases: [35, 45, 55], reward: 160, rarity: 'legendary', baseCost: 2500 },
  Pumpkin: { phases: [30, 40, 50], reward: 140, rarity: 'legendary', baseCost: 3000 },
  Apple: { phases: [40, 50, 60], reward: 180, rarity: 'legendary', baseCost: 3300 },
  Bamboo: { phases: [60, 70, 80], reward: 300, rarity: 'legendary', baseCost: 4000 },
  Coconut: { phases: [55, 65, 75], reward: 260, rarity: 'mythical', baseCost: 6000 },
  Cactus: { phases: [60, 70, 80], reward: 320, rarity: 'mythical', baseCost: 15000 },
  DragonFruit: { phases: [70, 80, 90], reward: 400, rarity: 'mythical', baseCost: 50000 },
  Mango: { phases: [50, 60, 70], reward: 225, rarity: 'mythical', baseCost: 100000 },
  Grape: { phases: [45, 55, 65], reward: 190, rarity: 'divine', baseCost: 850000 },
  Mushroom: { phases: [20, 30, 40], reward: 110, rarity: 'divine', baseCost: 150000 },
  Pepper: { phases: [18, 28, 38], reward: 100, rarity: 'divine', baseCost: 1000000 },
  Cacao: { phases: [55, 65, 75], reward: 270, rarity: 'divine', baseCost: 2500000 },
  Beanstalk: { phases: [45, 55, 65], reward: 210, rarity: 'prismatic', baseCost: 10000000 },
  EmberLily: { phases: [70, 80, 90], reward: 420, rarity: 'prismatic', baseCost: 15000000 },
  SugarApple: { phases: [70, 80, 90], reward: 430, rarity: 'prismatic', baseCost: 25000000 },
  BurningBud: { phases: [80, 90, 100], reward: 520, rarity: 'prismatic', baseCost: 40000000 },
  GiantPinecone: { phases: [80, 90, 100], reward: 540, rarity: 'prismatic', baseCost: 55000000 },
  ElderStrawberry: { phases: [85, 95, 105], reward: 560, rarity: 'prismatic', baseCost: 70000000 },
  Romanesco: { phases: [90, 100, 110], reward: 600, rarity: 'prismatic', baseCost: 88000000 },
};

const SEED_KEY_MAP = Object.keys(SEED_TYPES).reduce((m, k) => { m[k.toLowerCase()] = k; return m; }, {});
function normalizeSeedType(name) { if (!name) return null; return SEED_KEY_MAP[name.toLowerCase()] || null; }

function phasesToMs(arr) { return arr.map(m => m * 60 * 1000); }

function now() { return Date.now(); }

// Hourly period key (epoch ms floored to hour)
function currentPeriod() { return Math.floor(now() / (60 * 60 * 1000)) * 60 * 60 * 1000; }

// Determine rotation seeds (simple rarity-weighted random)
function pickRotationSeeds(count = 5) {
  const entries = Object.entries(SEED_TYPES);
  const weights = { common: 1, uncommon: 1.5, rare: 2.2, epic: 3, legendary: 4, mythical: 5, prismatic: 6, divine: 7 };
  const pool = entries.map(([k, v]) => ({ key: k, w: weights[v.rarity] || 1 }));
  const chosen = new Set();
  while (chosen.size < Math.min(count, pool.length)) {
    const totalW = pool.reduce((a, b) => a + (chosen.has(b.key) ? 0 : b.w), 0);
    let r = Math.random() * totalW;
    for (const item of pool) {
      if (chosen.has(item.key)) continue;
      if ((r -= item.w) <= 0) { chosen.add(item.key); break; }
    }
  }
  return Array.from(chosen);
}

async function ensureRotation(guildId) {
  const period = currentPeriod();
  const [rows] = await conn.promise().query(`SELECT seedType FROM gardenSeedRotation WHERE guildId=? AND periodStart=?`, [guildId, period]);
  if (rows.length) return period; // already created
  const picks = pickRotationSeeds(5);
  // Stock scaling: rarer seeds fewer stock
  const baseStockByRarity = { common: 50, uncommon: 40, rare: 30, epic: 20, legendary: 10, mythical: 5, prismatic: 4, divine: 3 };
  const values = picks.map(k => [guildId, period, k, baseStockByRarity[SEED_TYPES[k].rarity] || 15]);
  await conn.promise().query(`INSERT INTO gardenSeedRotation (guildId,periodStart,seedType,stock) VALUES ?`, [values]);
  return period;
}

async function getRotation(guildId) {
  const period = await ensureRotation(guildId);
  const [rows] = await conn.promise().query(`SELECT seedType, stock FROM gardenSeedRotation WHERE guildId=? AND periodStart=?`, [guildId, period]);
  return { period, expiresAt: period + 60 * 60 * 1000, seeds: rows };
}

async function getUserPurchases(guildId, userId) {
  const period = currentPeriod();
  const [rows] = await conn.promise().query(`SELECT seedType, amount FROM gardenSeedPurchases WHERE guildId=? AND periodStart=? AND userId=?`, [guildId, period, userId]);
  const map = {}; rows.forEach(r => map[r.seedType] = r.amount);
  return { period, map };
}

// Purchase with stock + per-user limit (e.g., max 40% of original stock per user for that seed this hour)
async function purchaseRotatedSeed(guildId, userId, seedType, amount) {
  const canonical = normalizeSeedType(seedType);
  if (!canonical) throw new Error('Unknown seed');
  const period = await ensureRotation(guildId);
  // Fetch rotation row
  const [[rot]] = await conn.promise().query(`SELECT stock FROM gardenSeedRotation WHERE guildId=? AND periodStart=? AND seedType=?`, [guildId, period, canonical]);
  if (!rot) throw new Error('Seed not in current rotation');
  if (rot.stock <= 0) throw new Error('Out of stock');
  if (amount < 1) throw new Error('Amount must be >=1');
  const originalStock = rot.originalStock || rot.stock; // we didn't store original; approximate by current+user purchases aggregate
  // compute user purchased so far
  const [[userRow]] = await conn.promise().query(`SELECT amount FROM gardenSeedPurchases WHERE guildId=? AND periodStart=? AND userId=? AND seedType=?`, [guildId, period, userId, canonical]);
  const userBought = userRow ? userRow.amount : 0;
  const perUserCap = Math.max(1, Math.floor((originalStock) * 0.4));
  if (userBought + amount > perUserCap) throw new Error(`Limit per user this hour: ${perUserCap} (you have ${userBought})`);
  if (amount > rot.stock) throw new Error(`Only ${rot.stock} left in stock`);
  // Cost
  const costEach = SEED_TYPES[canonical].baseCost;
  const total = costEach * amount;
  const prof = await getProfile(guildId, userId);
  if (prof.cash < total) throw new Error(`Need $${total}, you have $${prof.cash}`);
  // Transaction: deduct stock, record purchase, deduct cash, add seeds
  const connP = conn.promise();
  await connP.query('UPDATE gardenSeedRotation SET stock=stock-? WHERE guildId=? AND periodStart=? AND seedType=? AND stock>=?', [amount, guildId, period, canonical, amount]);
  const [[after]] = await connP.query('SELECT stock FROM gardenSeedRotation WHERE guildId=? AND periodStart=? AND seedType=?', [guildId, period, canonical]);
  if (!after || after.stock < 0) throw new Error('Stock update failed');
  await connP.query(`INSERT INTO gardenSeedPurchases (guildId,periodStart,userId,seedType,amount) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE amount=amount+VALUES(amount)`, [guildId, period, userId, canonical, amount]);
  await modifyBalance(guildId, userId, -total);
  await addSeeds(guildId, userId, canonical, amount);
  return { seedType: canonical, amount, totalCost: total, remaining: after.stock, periodEnds: period + 60 * 60 * 1000 };
}

async function addSeeds(guildId, userId, seedType, amount) {
  const canonical = normalizeSeedType(seedType);
  if (!canonical) throw new Error('Unknown seed');
  await ensureProfile(guildId, userId);
  await conn.promise().query(`INSERT INTO gardenSeedInventory (guildId,userId,seedType,amount) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE amount=GREATEST(0,amount+VALUES(amount))`, [guildId, userId, canonical, amount]);
  return getAllSeeds(guildId, userId);
}

async function getAllSeeds(guildId, userId) {
  await ensureProfile(guildId, userId);
  const [rows] = await conn.promise().query(`SELECT seedType, amount FROM gardenSeedInventory WHERE guildId=? AND userId=?`, [guildId, userId]);
  const inv = {}; rows.forEach(r => inv[r.seedType] = r.amount);
  // ensure all keys present
  for (const k of Object.keys(SEED_TYPES)) if (inv[k] == null) inv[k] = 0;
  return inv;
}

async function ensureProfile(guildId, userId) {
  await conn.promise().query(`INSERT IGNORE INTO gardenProfiles (guildId,userId) VALUES (?,?)`, [guildId, userId]);
}

async function getProfile(guildId, userId) {
  await ensureProfile(guildId, userId);
  const [rows] = await conn.promise().query(`SELECT cash,seeds,fertilizer,plotSlots FROM gardenProfiles WHERE guildId=? AND userId=?`, [guildId, userId]);
  return rows[0];
}

async function modifyBalance(guildId, userId, delta) {
  await ensureProfile(guildId, userId);
  await conn.promise().query(`UPDATE gardenProfiles SET cash = GREATEST(0, cash + ?) WHERE guildId=? AND userId=?`, [delta, guildId, userId]);
  return getProfile(guildId, userId);
}

async function giveSeeds(guildId, userId, delta) {
  await ensureProfile(guildId, userId);
  await conn.promise().query(`UPDATE gardenProfiles SET seeds = GREATEST(0, seeds + ?) WHERE guildId=? AND userId=?`, [delta, guildId, userId]);
  return getProfile(guildId, userId);
}

async function getPlots(guildId, userId) {
  await ensureProfile(guildId, userId);
  const profile = await getProfile(guildId, userId);
  const [rows] = await conn.promise().query(`SELECT slot, stage, plantedAt, seedType FROM gardenPlots WHERE guildId=? AND userId=?`, [guildId, userId]);
  // fill missing slots
  const map = {}; rows.forEach(r => map[r.slot] = r);
  const list = [];
  for (let i = 1; i <= profile.plotSlots; i++) {
    const p = map[i] || { slot: i, stage: 0, plantedAt: 0, seedType: null };
    list.push(p);
  }
  const seeds = await getAllSeeds(guildId, userId);
  return { profile, plots: list, seeds };
}

function calcStage(stage, plantedAt, seedType) {
  if (stage === 0) return 0;
  const def = SEED_TYPES[seedType] || SEED_TYPES.Carrot;
  const phases = phasesToMs(def.phases);
  const elapsed = now() - plantedAt;
  let s = 1; let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    acc += phases[i];
    if (elapsed < acc) return s;
    s++;
  }
  return 4;
}

async function plantSeed(guildId, userId, slot, seedType) {
  const canonical = normalizeSeedType(seedType) || 'Carrot';
  const { profile, plots, seeds } = await getPlots(guildId, userId);
  if (slot < 1 || slot > profile.plotSlots) throw new Error('Invalid slot');
  const target = plots.find(p => p.slot === slot);
  if (target.stage !== 0) throw new Error('Slot not empty');
  if (!seeds[canonical] || seeds[canonical] <= 0) throw new Error('No seeds of that type');
  await conn.promise().query(`UPDATE gardenSeedInventory SET amount=amount-1 WHERE guildId=? AND userId=? AND seedType=? AND amount>0`, [guildId, userId, canonical]);
  await conn.promise().query(`REPLACE INTO gardenPlots (guildId,userId,slot,stage,plantedAt,seedType) VALUES (?,?,?,?,?,?)`, [guildId, userId, slot, 1, now(), canonical]);
  return getPlots(guildId, userId);
}

async function refreshGrowthStates(guildId, userId) {
  const [rows] = await conn.promise().query(`SELECT slot, stage, plantedAt, seedType FROM gardenPlots WHERE guildId=? AND userId=?`, [guildId, userId]);
  let changed = false;
  for (const r of rows) {
    const computed = calcStage(r.stage, r.plantedAt, r.seedType);
    if (computed !== r.stage) {
      await conn.promise().query(`UPDATE gardenPlots SET stage=? WHERE guildId=? AND userId=? AND slot=?`, [computed, guildId, userId, r.slot]);
      changed = true;
    }
  }
  return changed;
}

async function harvest(guildId, userId, slot) {
  await refreshGrowthStates(guildId, userId);
  const [rows] = await conn.promise().query(`SELECT slot, stage, seedType FROM gardenPlots WHERE guildId=? AND userId=? AND slot=?`, [guildId, userId, slot]);
  if (!rows.length) throw new Error('Nothing planted');
  const plot = rows[0];
  if (plot.stage < 4) throw new Error('Not ready');
  const def = SEED_TYPES[plot.seedType] || SEED_TYPES.Carrot;
  const reward = def.reward; // TODO: add modifiers
  await conn.promise().query(`DELETE FROM gardenPlots WHERE guildId=? AND userId=? AND slot=?`, [guildId, userId, slot]);
  await modifyBalance(guildId, userId, reward);
  return { reward, seedType: plot.seedType, profile: await getProfile(guildId, userId) };
}

module.exports = { SEED_TYPES, getProfile, modifyBalance, giveSeeds, getPlots, plantSeed, harvest, refreshGrowthStates, addSeeds, getAllSeeds, getRotation, purchaseRotatedSeed, getUserPurchases };
