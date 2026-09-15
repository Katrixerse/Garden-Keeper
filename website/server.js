// ============================================================================
// Modular Server Entrypoint
// ============================================================================
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const crypto = require('crypto');
const { rateLimit } = require('./middleware/rateLimit');
const { DEFAULT_PORT } = require('./config');
const { baseLayout, escapeHtml } = require('./util/html');
const pagesRouter = require('./routes/pages');
const gardenKeeperRouter = require('./routes/gardenKeeper');
const oauthRouter = require('./routes/oauth');
const apiRouter = require('./routes/api');
const captchaRouter = require('./routes/captcha');
const { sessionMiddleware } = require('./lib/sessions');
const { projects } = require('./data');
const { requireApiKey } = require('./lib/auth');

const app = express();
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 300 }));
app.use(sessionMiddleware);
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '6h' }));

// Request logger
app.use((req,res,next)=>{ const start = process.hrtime.bigint(); res.on('finish',()=>{ const ms = Number(process.hrtime.bigint()-start)/1e6; console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`); }); next(); });

// Mount routers
app.use(pagesRouter, (req,res,next)=>{/* page fallback handler after router populates body */ next();});
app.use(gardenKeeperRouter);
app.use(oauthRouter);
app.use(apiRouter);
app.use(captchaRouter);

// Garden Keeper landing moved to gardenKeeper router

// Contact form submit
app.post('/contact', (req,res)=>{
	const { name='', email='', message='' } = req.body || {};
	if(!name.trim()||!email.trim()||!message.trim()) return res.status(400).json({ error: 'All fields required.' });
	if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
	if(message.length>1500) return res.status(400).json({ error: 'Message too long.' });
	console.log('[CONTACT] New message:', { name, email, len: message.length });
	res.json({ success:true, received:{ name, email } });
});

// Feeds / Meta
app.get('/sitemap.xml',(req,res)=>{ const urls=['/','/projects','/resume','/contact',...projects.map(p=>`/projects/${p.id}`)]; const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>https://example.com${u}</loc></url>`).join('')}</urlset>`; res.type('application/xml').send(xml); });
app.get('/feed.xml',(req,res)=>{ const rss=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Projects Feed</title><link>https://example.com/</link><description>Recent projects</description>${projects.map(p=>`<item><title>${escapeHtml(p.name)}</title><link>https://example.com/projects/${p.id}</link><description>${escapeHtml(p.tagline)}</description></item>`).join('')}</channel></rss>`; res.type('application/rss+xml').send(rss); });

// Page render wrapper (after routers): if a page route set _renderBody
app.use((req,res,next)=>{ if(typeof req._renderBody === 'function'){ const body = req._renderBody(); const title=req._pageTitle||'Developer Portfolio'; const description=req._pageDescription||'Portfolio'; return res.send(baseLayout({ title, description, body, canonical: req.path })); } next(); });

// 404 & Error handlers
app.use((req,res)=>{ if(req.path.startsWith('/api/')) return res.status(404).json({ error:'Not found'}); res.status(404).send(baseLayout({ title:'Not Found', body:'<h1>404</h1><p>The page you requested was not found.</p>' })); });
// eslint-disable-next-line no-unused-vars
app.use((err,req,res,next)=>{ console.error('Server error:', err); if(req.path.startsWith('/api/')) return res.status(500).json({ error:'Internal server error' }); res.status(500).send(baseLayout({ title:'Error', body:'<h1>500</h1><p>Something went wrong.</p>' })); });

function start(port=DEFAULT_PORT){ return app.listen(port, ()=> console.log(`\nServer running on https://localhost:${port}\n`)); }
function attachClient(c){ app.set('discordClient', c); }

module.exports = { app, start, attachClient };


