const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { API_KEYS, KEY_HASHES } = require('../config');

// Per-key buckets (export for testing)
const keyBuckets = new Map(); // keyId -> { start, count }

function constantTimeEqual(a,b){
  try {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if(ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch { return false; }
}

function requireApiKey(req,res,next){
  if(API_KEYS.length === 0) return res.status(503).json({ error: 'API keys not configured' });
  const provided = (req.header('x-api-key') || '').trim();
  if(!provided) return res.status(401).json({ error: 'Unauthorized' });
  let matched = null;
  for(const k of API_KEYS){ if(constantTimeEqual(provided, k)){ matched = k; break; } }
  if(!matched) return res.status(401).json({ error: 'Unauthorized' });
  req.apiKeyRaw = matched;
  req.apiKeyId = KEY_HASHES.get(matched);
  next();
}

function keyRateLimit({ windowMs = 60_000, max = 500, ownerKey = 'd5c30fef-a5b6-4f3b-91da-6e62bef23d62', ownerIp = '138.197.137.33' } = {}){
  // Determine raw hash for ownerKey if provided
  let ownerHash = null;
  if(ownerKey){
    for(const k of API_KEYS){ if(constantTimeEqual(k, ownerKey)){ ownerHash = KEY_HASHES.get(k); break; } }
  }
  return function(req,res,next){
    // Exempt owner by key hash or IP (trusts req.ip as configured by Express/proxy)
    if((ownerHash && req.apiKeyId === ownerHash) || (ownerIp && req.ip && req.ip.includes(ownerIp))){
      res.setHeader('X-RateLimit-Limit', 'unlimited');
      res.setHeader('X-RateLimit-Remaining', 'unlimited');
      res.setHeader('X-RateLimit-Reset', '0');
      return next();
    }
    if(!req.apiKeyId) return next();
    const now = Date.now();
    let bucket = keyBuckets.get(req.apiKeyId);
    if(!bucket || now - bucket.start >= windowMs){
      bucket = { start: now, count: 0 };
      keyBuckets.set(req.apiKeyId, bucket);
    }
    bucket.count++;
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((bucket.start + windowMs)/1000));
    if(bucket.count > max){
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfterSec: Math.ceil((bucket.start + windowMs - now)/1000) });
    }
    next();
  };
}

// Audit logging
const auditDir = path.join(__dirname, '..', 'logs');
try { if(!fs.existsSync(auditDir)) fs.mkdirSync(auditDir); } catch {}
const auditPath = path.join(auditDir, 'audit.log');
const auditStream = fs.createWriteStream(auditPath, { flags: 'a' });
function auditLog(req,res,next){
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start)/1e6;
    const line = JSON.stringify({
      time: new Date().toISOString(),
      key: req.apiKeyId || null,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: +durMs.toFixed(2)
    });
    auditStream.write(line + '\n');
  });
  next();
}

module.exports = { requireApiKey, keyRateLimit, auditLog, constantTimeEqual, keyBuckets };
