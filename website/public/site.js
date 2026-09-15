// Theme toggle & small UX helpers
(function(){
  const root = document.documentElement;
  const body = document.body;
  function currentPrefersDark(){
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return true; }
  }
  function apply(theme){
    if(theme!=='dark' && theme!=='light') theme='dark';
    root.dataset.theme = theme; // primary (existing CSS uses this)
    root.classList.toggle('light', theme==='light');
    root.classList.toggle('dark', theme==='dark');
    body.classList.toggle('light', theme==='light');
    body.classList.toggle('dark', theme==='dark');
    try { localStorage.setItem('theme', theme); } catch {}
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }
  function init(){
    const stored = (()=>{ try { return localStorage.getItem('theme'); } catch { return null; } })();
    const initial = stored || (currentPrefersDark() ? 'dark' : 'light');
    apply(initial);
  }
  init();
  // Toggle handler (delegated)
  document.addEventListener('click', e => {
    const btn = e.target?.closest && e.target.closest('#themeToggle');
    if(btn){
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
    }
  });
  // React to OS scheme changes if user hasn't explicitly chosen (no stored value)
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', e => {
      const stored = localStorage.getItem('theme');
      if(!stored){ apply(e.matches ? 'dark' : 'light'); }
    });
  } catch {}
})();

// Lightweight particle background (performance-friendly, animated)
(function(){
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(prefersReduce.matches) return; // honor reduced motion
  const ID='bg-particles';
  let canvas=document.getElementById(ID);
  if(!canvas){
    canvas=document.createElement('canvas');
    canvas.id=ID; canvas.setAttribute('aria-hidden','true');
    document.body.appendChild(canvas);
  }
  const ctx=canvas.getContext('2d');
  const particles=[]; const BASE=55; const AREA_DIV=26000; const LINK_DIST=120;
  // Mouse interaction state
  const mouse = { x:0, y:0, active:false };
  window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener('pointerleave', () => { mouse.active = false; });
  window.addEventListener('blur', () => { mouse.active = false; });
  function rand(a,b){return a+Math.random()*(b-a);}  
  function sizeCanvas(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; adjustCount(); }
  function adjustCount(){
    const target=Math.min(BASE, Math.floor((canvas.width*canvas.height)/AREA_DIV));
    while(particles.length<target) particles.push(makeParticle());
    if(particles.length>target) particles.length=target;
  }
  function makeParticle(){ return { x:rand(0,canvas.width), y:rand(0,canvas.height), r:rand(1.2,2.4), baseR:0, vx:rand(-0.03,0.03), vy:rand(-0.025,0.025), o:rand(0.25,0.75), phase:Math.random()*Math.PI*2 }; }
  function themeColors(){ return (document.documentElement.dataset.theme!=='light') ? ['255,184,120','244,154,50','255,215,160'] : ['244,154,50','180,110,40','255,189,89']; }
  let last=0; const FPS=50; let driftT=0;
  const MOUSE_RADIUS = 140; // px influence radius
  const FORCE = 0.035; // strength scalar
  function step(ts){
    if(ts-last < 1000/FPS){ return requestAnimationFrame(step); }
    last=ts;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cols=themeColors();
    driftT += 0.00025 * (ts-last);
    const driftX = Math.sin(driftT)*0.15;
    const driftY = Math.cos(driftT*0.9)*0.12;
    for(const p of particles){
      p.x+=p.vx + driftX; p.y+=p.vy + driftY;
      if(p.x<-10) p.x=canvas.width+10; else if(p.x>canvas.width+10) p.x=-10;
      if(p.y<-10) p.y=canvas.height+10; else if(p.y>canvas.height+10) p.y=-10;
      // Mouse repulsion
      if(mouse.active){
        const dx = p.x - mouse.x; const dy = p.y - mouse.y; const dist = Math.hypot(dx,dy);
        if(dist < MOUSE_RADIUS && dist > 0.001){
          const push = (1 - dist / MOUSE_RADIUS) * FORCE;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
        }
      }
    }
    // draw links first (subtle)
    ctx.lineWidth=0.8; ctx.globalAlpha=1;
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const dx=a.x-b.x, dy=a.y-b.y; const d=dx*dx+dy*dy;
        if(d < LINK_DIST*LINK_DIST){
          const o=1 - Math.sqrt(d)/LINK_DIST; if(o>0){
            ctx.strokeStyle=`rgba(244,154,50,${(0.12*o).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
      }
    }
    for(const p of particles){
      p.phase += 0.01; const pulse = (Math.sin(p.phase)+1)/8; // subtle 0..0.25
      const c = cols[(p._ci=(p._ci||0)+1)%cols.length];
      ctx.beginPath(); ctx.fillStyle=`rgba(${c},${p.o})`; ctx.arc(p.x,p.y,p.r + pulse,0,Math.PI*2); ctx.fill();
    }
    // Cursor halo & connection lines
    if(mouse.active){
      ctx.beginPath();
      const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS);
      grd.addColorStop(0,'rgba(244,154,50,0.25)');
      grd.addColorStop(1,'rgba(244,154,50,0)');
      ctx.fillStyle = grd;
      ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI*2);
      ctx.fill();
      // optional highlight point
      ctx.beginPath(); ctx.fillStyle='rgba(255,200,120,0.9)'; ctx.arc(mouse.x, mouse.y, 2.2, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(step);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);
  document.addEventListener('themechange', ()=>{/* colors swap next frame */});
  requestAnimationFrame(step);
})();

// Global helpers: year stamp + logout handler (no inline scripts needed)
(function(){
  function applyYear(){
    try { document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear()); } catch {}
  }
  async function handleLogout(ev){
    try { ev?.preventDefault(); ev?.stopPropagation?.(); } catch {}
    try { await fetch('/garden-keeper/auth/logout', { method:'POST' }); } catch {}
    // Navigate to a public page after logout to avoid OAuth bounce from protected routes
    try { window.location.replace('/garden-keeper'); } catch { window.location.href = '/garden-keeper'; }
  }
  function wireLogout(){
    const b = document.getElementById('logoutBtn');
    if(b){ b.addEventListener('click', handleLogout, { once:false }); }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ applyYear(); wireLogout(); });
  } else { applyYear(); wireLogout(); }
})();
