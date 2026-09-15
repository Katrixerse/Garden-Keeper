const { conn } = require('./dbConnection');

async function initLevelsTable(){
  const sql = `CREATE TABLE IF NOT EXISTS user_levels (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    xp BIGINT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 0,
    last_message_ts BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id,user_id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  await conn.promise().query(sql);
}

async function initBadgesTable(){
  const sql = `CREATE TABLE IF NOT EXISTS user_badges (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    badge_key VARCHAR(64) NOT NULL,
    earned_at BIGINT NOT NULL,
    PRIMARY KEY (guild_id,user_id,badge_key)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  await conn.promise().query(sql);
}

// Title thresholds (highest level reached determines displayed title)
const TITLE_THRESHOLDS = [
  { level: 0, title: 'Seedling' },
  { level: 5, title: 'Sprout' },
  { level: 10, title: 'Gardener' },
  { level: 20, title: 'Cultivator' },
  { level: 35, title: 'Botanist' },
  { level: 50, title: 'Master Gardener' }
];

// Badge definitions (can expand with different criteria later)
const BADGE_DEFS = [
  { key: 'lvl10', level: 10, label: 'Lv10' },
  { key: 'lvl25', level: 25, label: 'Lv25' },
  { key: 'lvl50', level: 50, label: 'Lv50' },
  { key: 'lvl75', level: 75, label: 'Lv75' },
  { key: 'lvl100', level: 100, label: 'Lv100' }
];

// Profile customization (rank card background)
const PRESET_BACKGROUNDS = ['forest','dusk','sunset','ocean','midnight'];

async function initProfilesTable(){
  const sql = `CREATE TABLE IF NOT EXISTS user_profiles (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    bg_type ENUM('preset','color','image') NOT NULL DEFAULT 'preset',
    bg_value VARCHAR(255) NULL,
    PRIMARY KEY (guild_id,user_id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  await conn.promise().query(sql);
}

async function getRankCardBackground(guildId, userId){
  await initProfilesTable();
  const [rows] = await conn.promise().query('SELECT bg_type, bg_value FROM user_profiles WHERE guild_id=? AND user_id=?',[guildId,userId]);
  if(!rows.length) return null; // use default
  return rows[0];
}

async function setRankCardBackground(guildId, userId, input){
  await initProfilesTable();
  if(!input) throw new Error('Provide a background value (preset name, hex color, or image URL).');
  input = input.trim();
  let bg_type='preset';
  let bg_value=null;
  const lower = input.toLowerCase();
  if(lower === 'default' || lower === 'reset'){
    // remove custom -> delete row
    await conn.promise().query('DELETE FROM user_profiles WHERE guild_id=? AND user_id=?',[guildId,userId]);
    return { reset:true };
  }
  if(PRESET_BACKGROUNDS.includes(lower)){
    bg_type='preset'; bg_value=lower;
  } else if(/^#([0-9a-fA-F]{6})$/.test(input)){ // hex color
    bg_type='color'; bg_value=input.toUpperCase();
  } else if(/^https?:\/\/.+\.(png|jpe?g|webp)$/i.test(input)){ // image URL
    if(input.length > 230) throw new Error('Image URL too long.');
    bg_type='image'; bg_value=input;
  } else {
    throw new Error('Invalid background. Use a preset name, a hex color like #1A2B3C, or a direct image URL ending in .png/.jpg/.jpeg/.webp');
  }
  await conn.promise().query('INSERT INTO user_profiles (guild_id,user_id,bg_type,bg_value) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE bg_type=VALUES(bg_type), bg_value=VALUES(bg_value)',[guildId,userId,bg_type,bg_value]);
  return { bg_type, bg_value };
}

function getTitleForLevel(level){
  let current = TITLE_THRESHOLDS[0].title;
  for(const t of TITLE_THRESHOLDS){
    if(level >= t.level) current = t.title; else break;
  }
  return current;
}

async function getBadges(guildId, userId){
  await initBadgesTable();
  const [rows] = await conn.promise().query('SELECT badge_key, earned_at FROM user_badges WHERE guild_id=? AND user_id=?',[guildId,userId]);
  const owned = rows.map(r => r.badge_key);
  // Append developer badge dynamically (not stored) if user is in configured developer list
  if(isDeveloper(userId) && !owned.includes('dev')) owned.push('dev');
  return owned;
}

async function awardBadgesForLevel(guildId, userId, level){
  await initBadgesTable();
  const existing = new Set(await getBadges(guildId,userId));
  const toAward = BADGE_DEFS.filter(b => level >= b.level && !existing.has(b.key));
  if(!toAward.length) return [];
  const now = Date.now();
  const values = toAward.map(b => [guildId,userId,b.key,now]);
  await conn.promise().query('INSERT IGNORE INTO user_badges (guild_id,user_id,badge_key,earned_at) VALUES ?',[values]);
  return toAward.map(b => b.key);
}

async function addXP(guildId, userId, amount, cooldownMs=60000){
  const now = Date.now();
  await initLevelsTable();
  const [rows] = await conn.promise().query('SELECT xp, level, last_message_ts FROM user_levels WHERE guild_id=? AND user_id=?',[guildId,userId]);
  if(rows.length){
    const row = rows[0];
    if(now - row.last_message_ts < cooldownMs) return { ...row, changed:false };
  let newXP = row.xp + amount;
  let previousLevel = row.level;
  let newLevel = row.level;
    let needed = calcNeededXP(row.level+1);
    let leveledUp = false;
    while(newXP >= needed){
      newLevel++; leveledUp = true; needed = calcNeededXP(newLevel+1);
    }
    await conn.promise().query('UPDATE user_levels SET xp=?, level=?, last_message_ts=? WHERE guild_id=? AND user_id=?',[newXP,newLevel,now,guildId,userId]);
    let newBadges = [];
    if(leveledUp){
      newBadges = await awardBadgesForLevel(guildId,userId,newLevel);
    }
  return { xp:newXP, level:newLevel, previousLevel, last_message_ts: now, changed:true, leveledUp, newBadges };
  } else {
  const baseXP = amount;
  let previousLevel = 0;
  let level = 0;
    let needed = calcNeededXP(level+1);
    let newXP = baseXP;
    let leveledUp=false;
    while(newXP >= needed){ level++; leveledUp=true; needed=calcNeededXP(level+1); }
    await conn.promise().query('INSERT INTO user_levels (guild_id,user_id,xp,level,last_message_ts) VALUES (?,?,?,?,?)',[guildId,userId,newXP,level,now]);
    let newBadges = [];
    if(leveledUp){
      newBadges = await awardBadgesForLevel(guildId,userId,level);
    }
  return { xp:newXP, level, previousLevel, last_message_ts: now, changed:true, leveledUp, newBadges };
  }
}

function calcNeededXP(level){
  return 100 + (level-1)*100 + Math.floor(Math.pow(level,2)*5); // scalable curve
}

// Total XP required to reach a given level (sum of previous level requirements)
function calcTotalXpToLevel(level){
  let total = 0;
  for(let i=1;i<=level;i++) total += calcNeededXP(i);
  return total;
}

// Cumulative XP including progress within current level
function calcCumulativeXP(level, currentLevelXP){
  return calcTotalXpToLevel(level-1) + currentLevelXP; // level-1 because total to start current level
}

async function getLevel(guildId,userId){
  await initLevelsTable();
  const [rows] = await conn.promise().query('SELECT xp, level FROM user_levels WHERE guild_id=? AND user_id=?',[guildId,userId]);
  if(!rows.length) return { xp:0, level:0 };
  return rows[0];
}

async function getLeaderboard(guildId, limit=10){
  await initLevelsTable();
  const [rows] = await conn.promise().query('SELECT user_id, xp, level FROM user_levels WHERE guild_id=? ORDER BY level DESC, xp DESC LIMIT ?',[guildId, limit]);
  return rows;
}

// Developer badge support
// Configure developer IDs
const DEV_SET = new Set(['130515926117253122', '307472480627326987']);
function isDeveloper(userId) { 
    return DEV_SET.has(userId); 
}

module.exports = { addXP, getLevel, getLeaderboard, calcNeededXP, getBadges, getTitleForLevel, getRankCardBackground, setRankCardBackground, PRESET_BACKGROUNDS, isDeveloper, calcCumulativeXP };
