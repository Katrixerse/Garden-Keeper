const request = require('node-superfetch');

let cachedToken = null;
let tokenExpiry = 0;

function getConfig(){
	try { return require('../../../config.json'); } catch { return {}; }
}

async function fetchAppToken(){
	const cfg = getConfig();
	const clientId = cfg.twitch_client_id || process.env.TWITCH_CLIENT_ID || '';
	const clientSecret = cfg.twitch_client_secret || process.env.TWITCH_CLIENT_SECRET || '';
	if(!clientId || !clientSecret) throw new Error('Twitch client credentials missing (set twitch_client_id and twitch_client_secret in config.json or env).');
	const res = await request.post('https://id.twitch.tv/oauth2/token')
		.query({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })
		.set('User-Agent','GardenKeeperBot/1.0');
	if(!res.ok) throw new Error('Twitch token HTTP '+res.status);
	const body = res.body || JSON.parse(res.text);
	cachedToken = body.access_token;
	tokenExpiry = Date.now() + Math.max(0, (body.expires_in-60))*1000;
	return cachedToken;
}

async function getToken(){
	if(cachedToken && Date.now() < tokenExpiry) return cachedToken;
	return fetchAppToken();
}

async function apiGet(path, params={}){
	const cfg = getConfig();
	const clientId = cfg.twitch_client_id || process.env.TWITCH_CLIENT_ID || '';
	const token = await getToken();
	const res = await request.get('https://api.twitch.tv/helix'+path)
		.query(params)
		.set('Client-Id', clientId)
		.set('Authorization', 'Bearer '+token)
		.set('User-Agent','GardenKeeperBot/1.0');
	if(res.status === 401){ // token expired/invalid
		cachedToken = null;
		return apiGet(path, params);
	}
	if(!res.ok) throw new Error('Twitch API HTTP '+res.status);
	return res.body || JSON.parse(res.text);
}

// Input: array of login names; Output: array of { id, username }
async function getUsers(logins){
	const arr = Array.isArray(logins)? logins.filter(Boolean) : [logins];
	if(!arr.length) return [];
	const body = await apiGet('/users', { login: arr });
	const data = body.data || [];
	return data.map(u => ({ id: u.id, username: u.login }));
}

// Input: array of user IDs; Output: Helix streams data (raw)
async function getStreams(userIds){
	const arr = Array.isArray(userIds)? userIds.filter(Boolean) : [userIds];
	if(!arr.length) return [];
	const body = await apiGet('/streams', { user_id: arr });
	return body.data || [];
}

module.exports = { getUsers, getStreams };
