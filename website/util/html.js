function escapeHtml(str=''){
  if (Array.isArray(str)) str = str.join('\n');
  if (str === null || str === undefined) str = '';
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function baseLayout({ title='Developer Portfolio', description='Portfolio', body='', canonical='/', structuredData=null, image=null, noIndex=false, keywords=[], extraHead='' }){
  const siteUrlBase = 'https://katrixerse.com';
  const fullCanonical = canonical.startsWith('http') ? canonical : siteUrlBase.replace(/\/$/,'') + canonical;
  const jsonLd = structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : '';
  const ogImage = image ? (image.startsWith('http')? image : siteUrlBase.replace(/\/$/,'') + image) : siteUrlBase + '/public/og-default.png';
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow';
  const kw = Array.isArray(keywords) && keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join(', '))}" />` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${kw}
<meta name="robots" content="${robots}" />
<meta name="theme-color" content="#18181b" />
<link rel="canonical" href="${escapeHtml(fullCanonical)}" />
<link rel="icon" type="image/png" href="/public/favicon.ico" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Katrixerse Portfolio" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(fullCanonical)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(ogImage)}" />
<link rel="manifest" href="/public/manifest.json" />
<link rel="stylesheet" href="/public/style.css" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
${jsonLd}
${extraHead}
</head>
<body>
${nav()}
<main class="container">${body}</main>
${footer()}
<script src="/public/site.js" type="module"></script>
</body>
</html>`;
}

function nav(){
  return `<header class="site-header">
  <div class="container flex between center">
    <a class="logo" href="/"><span class="accent">&lt;/&gt;</span> Dev Portfolio</a>
    <nav>
      <a href="/projects">Projects</a>
      <a href="/resume">Resume</a>
      <a href="/contact">Contact</a>
      <a class="btn" href="/api/projects" target="_blank">API</a>
      <button id="themeToggle" aria-label="Toggle theme" class="ghost-btn" type="button">🌓</button>
    </nav>
  </div>
</header>`;
}

function footer(){
  return `<footer class="site-footer"><div class="container small">&copy; <span data-year></span> Katrixerse. Built with Express.</div></footer>`;
}

module.exports = { escapeHtml, baseLayout, nav, footer };
