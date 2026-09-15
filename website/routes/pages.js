const express = require('express');
const router = express.Router();
const { projects, skills } = require('../data');
const { escapeHtml } = require('../util/html');
// (Garden Keeper specific functionality moved to its own router)
// Attempt to pull live bot state when available (set in server via attachClient)

function projectCard(p) {
  return `<article class="card">
    <h3><a href="/projects/${p.id}">${escapeHtml(p.name)}</a></h3>
    <p class="tagline">${escapeHtml(p.tagline)}</p>
    <div class="tags">${p.tech.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
  </article>`;
}
function skillSection(skillsObj) {
  return `<section>
    <h2>Skills</h2>
    <div class="skills-grid">
      ${Object.entries(skillsObj).map(([cat, list]) => `<div class="skill-block"><h3>${escapeHtml(cat)}</h3><ul>${list.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>`).join('')}
    </div>
  </section>`;
}
function featuredProjects(list) {
  const feat = list.filter(p => p.featured);
  return `<section>
    <h2>Featured Projects</h2>
    <div class="grid">${feat.map(projectCard).join('')}</div>
  </section>`;
}

// Layout parts imported lazily in server for SSR wrapper
router.get('/', (req, res, next) => {
  req._renderBody = () => `
    <section class="hero">
      <h1>Hi, I'm <span class="accent">Katrixerse</span>.</h1>
      <p class="lead">I build scalable backend services, Discord bots, and performant web apps.</p>
      <div class="cta-group">
        <a class="btn" href="/projects">View Projects</a>
        <a class="btn secondary" href="/contact">Contact</a>
      </div>
    </section>
    ${skillSection(skills)}
    ${featuredProjects(projects)}
  `;
  next();
});

router.get('/projects', (req, res, next) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const filtered = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)) : projects;
  const searchBox = `<form class="search" method="get" action="/projects"><input name="q" placeholder="Search projects" value="${escapeHtml(q)}"/><button type="submit">Search</button>${q ? `<a class="clear" href="/projects">×</a>` : ''}</form>`;
  req._renderBody = () => `<section><h1>Projects</h1>${searchBox}<p class="muted">${filtered.length} project(s)${q ? ` matching "${escapeHtml(q)}"` : ''}.</p><div class="grid">${filtered.map(projectCard).join('') || '<p>No results.</p>'}</div></section>`;
  next();
});

router.get('/projects/:id', (req, res, next) => {
  const p = projects.find(x => x.id === req.params.id);
  if (!p) { return res.status(404).end(); }
  req._pageTitle = `${p.name} • Project`;
  req._pageDescription = p.tagline;
  req._renderBody = () => `<article class="project-detail">
    <a href="/projects" class="back">← Back to projects</a>
    <h1>${escapeHtml(p.name)}</h1>
    <p class="tagline">${escapeHtml(p.tagline)}</p>
    <p>${escapeHtml(p.description)}</p>
    <h3>Tech Stack</h3>
    <ul class="inline-tags">${p.tech.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
    ${p.highlights?.length ? `<h3>Highlights</h3><ul>${p.highlights.map(h => `<li>${escapeHtml(h)}`).join('')}</ul>` : ''}
    <div class="links">
      ${p.repo ? `<a class="btn" href="${escapeHtml(p.repo)}" target="_blank" rel="noopener">Source Code</a>` : ''}
      ${p.live ? `<a class="btn secondary" href="${escapeHtml(p.live)}" target="_blank" rel="noopener">Live Demo</a>` : ''}
    </div>
  </article>`;
  next();
});

router.get('/resume', (req, res, next) => {
  req._renderBody = () => `<section><h1>Resume</h1><p>Download a PDF or copy this structured summary.</p>
    <h2>Summary</h2><p>Backend-focused engineer with experience in real-time systems, bots, and API design.</p>
    <h2>Core Skills</h2>${skillSection(skills)}<p>(Replace with an actual resume download.)</p></section>`;
  next();
});

router.get('/contact', (req, res, next) => {
  req._renderBody = () => `<section><h1>Contact</h1>
    <form method="post" action="/contact" class="contact-form">
      <label>Name<input name="name" required maxlength="60"></label>
      <label>Email<input type="email" name="email" required maxlength="120"></label>
      <label>Message<textarea name="message" required maxlength="1500" rows="6"></textarea></label>
      <button class="btn" type="submit">Send</button>
    </form>
    <p class="muted small">This demo endpoint just logs to the server.</p>
    </section>`;
  next();
});

// Redirect status endpoint to external public status page
router.get('/status', (req, res) => {
  return res.redirect(302, 'https://gardenkeeper.statuspage.io/');
});

module.exports = router;
