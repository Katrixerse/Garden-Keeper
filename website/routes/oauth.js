const express = require('express');
const crypto = require('crypto');
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, DISCORD_OAUTH_SCOPES } = require('../config');
const { setUser } = require('../lib/oauthCache');
const { generateSession, parseCookies, sessions } = require('../lib/sessions');

const router = express.Router();

function discordAuthEnabled(){ return !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET); }

router.get('/garden-keeper/auth/discord', (req,res)=>{
  if(!discordAuthEnabled()) return res.status(503).send('Discord OAuth not configured');
  const state = crypto.randomBytes(8).toString('hex');
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: DISCORD_OAUTH_SCOPES.join(' '),
    prompt: 'none',
    state
  });
  res.redirect('https://discord.com/oauth2/authorize?' + params.toString());
});

router.get('/garden-keeper/auth/discord/callback', async (req,res)=>{
  if(!discordAuthEnabled()) return res.status(503).send('Discord OAuth not configured');
  const { code, error } = req.query;
  if(error) return res.status(400).send('OAuth error: ' + String(error));
  if(!code) return res.status(400).send('Missing code');
  try {
    const body = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code.toString(),
      redirect_uri: DISCORD_REDIRECT_URI,
      scope: DISCORD_OAUTH_SCOPES.join(' ')
    });
    const tokenResp = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if(!tokenResp.ok){
      const txt = await tokenResp.text();
      return res.status(400).send('Token exchange failed: ' + txt);
    }
    const tokenData = await tokenResp.json();
    const userResp = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` }});
    if(!userResp.ok){
      const txt = await userResp.text();
      return res.status(400).send('Failed to fetch user: ' + txt);
    }
  const user = await userResp.json();
  const expiresAt = Date.now() + (tokenData.expires_in*1000 - 30_000);
  // Cache the user briefly keyed by access token to avoid redundant fetches on immediate loads
  try { setUser(tokenData.access_token, user, 120_000); } catch {}
    const { sid } = generateSession({
      user: { id: user.id, username: user.username, discriminator: user.discriminator, global_name: user.global_name, avatar: user.avatar },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      expiresAt
    });
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookie = `sess=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=21600${secure?'; Secure':''}`;
    res.setHeader('Set-Cookie', cookie);
    res.redirect('/garden-keeper/dashboard');
  } catch (e) {
    console.error('OAuth callback error', e);
    res.status(500).send('Internal auth error');
  }
});

router.get('/garden-keeper/api/auth/me', (req,res)=>{
  if(!req.session) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.session.user, expiresAt: req.session.expiresAt });
});

router.post('/garden-keeper/auth/logout', (req,res)=>{
  try {
    const cookies = parseCookies(req);
    const sid = cookies.sess;
    if(sid) sessions.delete(sid);
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const del = `sess=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secure?'; Secure':''}`;
    res.setHeader('Set-Cookie', del);
  } catch {}
  // No redirect here; client will navigate to a public route after logout
  res.status(204).end();
});

module.exports = router;
