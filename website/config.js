// Central configuration & environment parsing
const crypto = require('crypto');

const config = require('./config.json');

const DEFAULT_PORT = config.port || 3000;

// Discord OAuth
const DISCORD_CLIENT_ID = config.discord.client_id || '';
const DISCORD_CLIENT_SECRET = config.discord.client_secret || '';
const DISCORD_REDIRECT_URI = config.discord.redirect_uri || 'http://localhost:3000/auth/discord/callback';
const DISCORD_OAUTH_SCOPES = (config.discord.oauth_scopes || 'identify').split(/[\s,]+/).filter(Boolean);
// Env keys (support comma / semicolon / space / newline separators)
const RAW_ENV = config.api_keys || [];
const envKeys = RAW_ENV.flatMap(k => k.split(/[^A-Za-z0-9_-]+/)).map(k => k.trim()).filter(Boolean);

const combined = [...envKeys].filter(Boolean);
const seenKeys = new Set();
const API_KEYS = combined.filter(k => { if(seenKeys.has(k)) return false; seenKeys.add(k); return true; });
if (API_KEYS.length === 0) {
  console.warn('[config] WARNING: No API keys loaded (env/API file/root config). API endpoints will return 503/Unauthorized.');
}
// Internal shared secret for bot -> website stock proxy (deprecated; prefer API_KEYS)
const KEY_HASHES = new Map();
API_KEYS.forEach(k => {
  const id = crypto.createHash('sha256').update(k).digest('hex').slice(0,12);
  KEY_HASHES.set(k, id);
});

module.exports = {
  DEFAULT_PORT,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  DISCORD_OAUTH_SCOPES,
  API_KEYS,
  KEY_HASHES
};
