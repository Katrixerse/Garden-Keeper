(function(){
  // Only run on tracking page
  const trackingIds = ['stockSection','merchantSection','weatherSection','foreverpackSection','predictionSection'];
  if(!trackingIds.some(id => document.getElementById(id))) return;

  // Tab wiring
  const tabButtons = Array.from(document.querySelectorAll('[data-tab-button]'));
  const tabPanels = new Map(Array.from(document.querySelectorAll('[data-tab-panel]')).map(el => [el.dataset.tabPanel, el]));
  tabPanels.forEach(panel => panel?.setAttribute('aria-hidden', panel.classList.contains('active') ? 'false' : 'true'));
  let currentTab = tabButtons.find(btn => btn.classList.contains('active'))?.dataset.tabButton || 'stock';
  let foreverFetched = false;
  let predictionFetched = false;

  function activateTab(key){
    if(!key || currentTab === key) return;
    currentTab = key;
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tabButton === key));
    tabPanels.forEach((panel, panelKey) => {
      const active = panelKey === key;
      panel.classList.toggle('active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    if(key === 'foreverpack' && !foreverFetched){ foreverFetched = true; fetchForever(true); }
    if(key === 'prediction' && !predictionFetched){ predictionFetched = true; fetchPrediction(true); }
  }

  if(tabButtons.length){
    document.addEventListener('click', e => {
      const btn = e.target?.closest?.('[data-tab-button]');
      if(btn){ activateTab(btn.dataset.tabButton); }
    });
  }

  function formatLocal(unix){
    if(!unix) return 'Unknown';
    try {
      const d=new Date(unix*1000);
      const now=new Date();
      const showDate=d.toDateString()!==now.toDateString();
      return (showDate? d.toLocaleDateString([], {month:'short', day:'numeric'})+' ' : '') + d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
    } catch { return 'Unknown'; }
  }
  function applyLocalTimes(){
    const mp=document.getElementById('merchantPre');
    if(mp && mp.dataset.merchantEnd){
      const u=Number(mp.dataset.merchantEnd);
      if(u){
        const lines=mp.textContent.split('\n');
        let replaced=false;
        for(let i=0;i<lines.length;i++){
          if(lines[i].startsWith('Leaves At:')){ lines[i]='Leaves At: '+formatLocal(u); replaced=true; }
        }
        if(!replaced){ lines.push('Leaves At: '+formatLocal(u)); }
        mp.textContent=lines.join('\n');
      }
    }
    document.querySelectorAll('#weatherSection .end-time').forEach(span=>{
      const u=Number(span.getAttribute('data-end'));
      if(u){ span.textContent=formatLocal(u); }
    });
  }

  // Stock + Merchant (shared fetch, independent timers)
  const STOCK_INTERVAL = 60000;
  let stockRemain = STOCK_INTERVAL;
  let stockActive = true;
  let stockPending = false;
  let merchantRemain = STOCK_INTERVAL;
  let merchantActive = true;
  const stockCd=document.getElementById('stockCountdown'); const merchantCd=document.getElementById('merchantCountdown');
  let lastTick = Date.now();
  function stockFmt(ms){ return Math.max(0, Math.ceil(ms/1000)); }
  function updStockCd(){ if(stockCd) stockCd.textContent=stockFmt(stockRemain); if(merchantCd) merchantCd.textContent=stockFmt(merchantRemain); }
  async function fetchStock(force){
    if(stockPending) return; stockPending=true;
    const finalize=()=>{ stockRemain=STOCK_INTERVAL; if(merchantActive) merchantRemain=STOCK_INTERVAL; stockPending=false; updStockCd(); };
    try {
      const url='/garden-keeper/api/stock'+(force?'?force':'');
      const r=await fetch(url); if(!r.ok) return finalize();
      const j=await r.json(); const s=j.stock||j; if(!s) return finalize();
      const list=a=>Array.isArray(a)?a.map(o=>(o.display_name||o.name||o.item||'Unknown')+' x'+(o.quantity||o.qty||o.count||1)).join('\n'):'';
      const norm={
        seedStock:list(s.seed_stock),
        gearStock:list(s.gear_stock),
        eggStock:list(s.egg_stock),
        eventStock:list(s.eventshop_stock),
        cosmeticStock:list(s.cosmetic_stock),
        merchantStock:(s.travelingmerchant_stock? (function(m){ if(!m.stock?.length)return''; const lines=list(m.stock); const cu=m.stock[0].end_date_unix?(m.stock[0].end_date_unix-12600):null; return 'Merchant: '+(m.merchantName||'Unknown')+'\nStock:\n'+lines+(cu?'\nLeaves At: '+formatLocal(cu):''); })(s.travelingmerchant_stock):'')
      };
      const map={seedStock:'Seed Stock',gearStock:'Gear Stock',eggStock:'Egg Stock',eventStock:'Event Stock',cosmeticStock:'Cosmetics'};
      for(const k in map){
        const h=[...document.querySelectorAll('#stockSection .stock-block h3')].find(x=>x.textContent===map[k]);
        if(!h) continue; h.parentElement.querySelector('pre').textContent=norm[k]||'no new data';
      }
      const merchantPre=document.getElementById('merchantPre');
      if(merchantPre){
        merchantPre.textContent=norm.merchantStock||'no merchant';
        if(s.travelingmerchant_stock?.stock?.[0]?.end_date_unix){ merchantPre.dataset.merchantEnd = s.travelingmerchant_stock.stock[0].end_date_unix - 12600; }
      }
      const ra=document.getElementById('stockRefreshedAt'); if(ra){ ra.textContent='Refreshed at '+new Date().toLocaleTimeString(); ra.setAttribute('data-refreshed-ts', Date.now()); }
      const mra=document.getElementById('merchantRefreshedAt'); if(mra){ mra.textContent='Refreshed at '+new Date().toLocaleTimeString(); mra.setAttribute('data-refreshed-ts', Date.now()); }
      applyLocalTimes();
    } catch(e){} finally { finalize(); }
  }
  const stockRefreshBtn=document.getElementById('stockManualRefresh'); const stockToggleBtn=document.getElementById('stockToggleAuto');
  if(stockRefreshBtn) stockRefreshBtn.addEventListener('click',()=>fetchStock(true));
  if(stockToggleBtn) stockToggleBtn.addEventListener('click',()=>{ stockActive=!stockActive; stockToggleBtn.textContent=stockActive?'Pause':'Resume'; if(stockActive&&stockRemain<=0) stockRemain=10; });
  const merchantRefreshBtn=document.getElementById('merchantManualRefresh'); const merchantToggleBtn=document.getElementById('merchantToggleAuto');
  if(merchantRefreshBtn) merchantRefreshBtn.addEventListener('click',()=>fetchStock(true));
  if(merchantToggleBtn) merchantToggleBtn.addEventListener('click',()=>{ merchantActive=!merchantActive; merchantToggleBtn.textContent=merchantActive?'Pause':'Resume'; if(merchantActive&&merchantRemain<=0) merchantRemain=10; });

  // Weather
  const WEATHER_INTERVAL = 30000;
  let weatherRemain = WEATHER_INTERVAL;
  let weatherActive = true;
  let weatherPending = false;
  const weatherCd = document.getElementById('weatherCountdown');
  function weatherFmt(ms){ return Math.max(0, Math.ceil(ms/1000)); }
  function updWeatherCd(){ if(weatherCd) weatherCd.textContent=weatherFmt(weatherRemain); }
  function updateEventCountdowns(){
    const now=Math.floor(Date.now()/1000);
    document.querySelectorAll('#weatherSection .weather-item .countdown').forEach(el=>{
      const end=Number(el.getAttribute('data-end'));
      const diff=end-now;
      if(!Number.isFinite(diff) || diff<=0){ el.textContent='Ended'; return; }
      const m=Math.floor(diff/60); const s=diff%60; const h=Math.floor(m/60); const mm=m%60;
      el.textContent=(h>0? h+'h '+(mm<10?'0':'')+mm+'m ':'') + (h===0? m+'m ':'') + (s<10?'0':'')+s+'s remaining';
    });
  }
  async function fetchWeather(force){
    if(weatherPending) return; weatherPending=true;
    const finalize=()=>{ weatherRemain=WEATHER_INTERVAL; weatherPending=false; updWeatherCd(); };
    try {
      const url='/garden-keeper/api/weather'+(force?'?force':'');
      const r=await fetch(url); if(!r.ok) return finalize();
      const j=await r.json();
      const data = j.weather || j;
      const eventsArr = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
      const nowUnix = Math.floor(Date.now()/1000);
      const events = eventsArr.filter(ev => {
        if(!ev) return false;
        const endUnix = Number(ev.endsAtUnix || ev.ends_at || ev.end_time || 0) || 0;
        return Number.isFinite(endUnix) && endUnix > nowUnix;
      });
      const trimmed = events.slice(0, 12);
      const grid=document.querySelector('#weatherSection .weather-grid'); if(!grid) return finalize();
      if(!trimmed.length){
        grid.innerHTML='<div class="gk-card"><p>No active weather events.</p></div>';
      } else {
        grid.innerHTML=trimmed.map(ev => {
          const endUnix = Number(ev.endsAtUnix || ev.ends_at || 0) || 0;
          const safeName = String(ev.name||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
          return `
          <div class="gk-card weather-item" data-ends-unix="${endUnix}">
            <div class="gk-card-head"><h3>${safeName}</h3></div>
            <div class="gk-card-body">
              <p class="meta">Ends at: <span class="end-time" data-end="${endUnix}">${formatLocal(endUnix)}</span></p>
              <p class="countdown" data-end="${endUnix}">Calculating...</p>
            </div>
          </div>`;
        }).join('');
      }
      const ra=document.getElementById('weatherRefreshedAt'); if(ra){ ra.textContent='Refreshed at '+new Date().toLocaleTimeString(); ra.setAttribute('data-refreshed-ts', Date.now()); }
      updateEventCountdowns(); applyLocalTimes();
    } catch(e){} finally { finalize(); }
  }

  // Forever Pack
  const FOREVER_INTERVAL = 600000; // 10 minutes
  let foreverRemain = FOREVER_INTERVAL;
  let foreverActive = true;
  let foreverPending = false;
  const foreverCd = document.getElementById('foreverCountdown');
  function updForeverCd(){ if(foreverCd) foreverCd.textContent = stockFmt(foreverRemain); }
  async function fetchForever(force){
    if(foreverPending) return; foreverPending = true; foreverFetched = true;
    const finalize = ()=>{ foreverRemain = FOREVER_INTERVAL; foreverPending = false; updForeverCd(); };
    try {
      const url = '/garden-keeper/api/foreverpack' + (force ? '?force' : '');
      const resp = await fetch(url);
      const pre = document.getElementById('foreverPre');
      if(!resp.ok){
        if(pre) pre.textContent = 'Forever Pack data is unavailable right now.';
        return;
      }
      let json;
      try {
        json = await resp.json();
      } catch(parseErr){
        const text = await resp.text();
        if(pre) pre.textContent = text ? text.slice(0, 500) : 'Forever Pack returned an unexpected response.';
        return;
      }
      const rewardsList = (()=>{
        if(Array.isArray(json?.normalized)) return json.normalized;
        if(Array.isArray(json?.rewards)) return json.rewards;
        if(Array.isArray(json?.data?.rewards)) return json.data.rewards;
        if(Array.isArray(json?.data)) return json.data;
        if(Array.isArray(json?.items)) return json.items;
        if(Array.isArray(json)) return json;
        return [];
      })();
      const lines = rewardsList.length ? rewardsList.map(entry => {
        const raw = entry?.raw && typeof entry.raw === 'object' ? entry.raw : entry;
        const name = entry?.name || raw?.Name || raw?.name || raw?.reward || raw?.title || 'Unknown';
        const tier = entry?.tier ?? raw?.Tier ?? raw?.tier ?? raw?.level;
        const price = entry?.price ?? raw?.Price ?? raw?.price ?? raw?.cost ?? raw?.value;
        const parts = [name];
        if(tier !== undefined && tier !== null && tier !== '') parts.push(`T${tier}`);
        if(price !== undefined && price !== null && price !== '') parts.push(`${price}`);
        return parts.join(' • ');
      }).join('\n') : 'No rewards available right now.';
      if(pre){ pre.textContent = lines || 'No rewards available right now.'; }
      const ra = document.getElementById('foreverRefreshedAt');
      const ts = Number(json?.refreshedAt) || Date.now();
      if(ra){ ra.textContent = 'Refreshed at '+new Date(ts).toLocaleTimeString(); ra.setAttribute('data-refreshed-ts', ts); }
    } catch(e){
      const pre = document.getElementById('foreverPre');
      if(pre) pre.textContent = 'Forever Pack failed to load. Try again later.';
    } finally { finalize(); }
  }
  const foreverRefreshBtn = document.getElementById('foreverManualRefresh');
  const foreverToggleBtn = document.getElementById('foreverToggleAuto');
  if(foreverRefreshBtn) foreverRefreshBtn.addEventListener('click', ()=>fetchForever(true));
  if(foreverToggleBtn) foreverToggleBtn.addEventListener('click', ()=>{
    foreverActive = !foreverActive;
    foreverToggleBtn.textContent = foreverActive ? 'Pause' : 'Resume';
    if(foreverActive && foreverRemain <= 0) foreverRemain = 10;
  });

  // Predicted Stock
  const PREDICTION_INTERVAL = 900000; // 15 minutes
  let predictionRemain = PREDICTION_INTERVAL;
  let predictionActive = true;
  let predictionPending = false;
  const predictionCd = document.getElementById('predictionCountdown');
  function updPredictionCd(){ if(predictionCd) predictionCd.textContent = stockFmt(predictionRemain); }
  function renderPredictionEntry(entry){
    if(!entry || typeof entry !== 'object') return String(entry ?? '');
    const name = entry.Name || entry.name || entry.item || entry.display_name || 'Unknown item';
    const tier = entry.Tier ?? entry.tier;
    const price = entry.Price ?? entry.price ?? entry.cost;
    const chance = entry.Chance ?? entry.chance ?? entry.probability ?? entry.Probability;
    const extras = [];
    if(tier !== undefined && tier !== null) extras.push(`T${tier}`);
    if(price !== undefined && price !== null) extras.push(`${price}`);
    if(chance !== undefined && chance !== null) extras.push(`Chance ${chance}`);
    return extras.length ? `${name} • ${extras.join(' • ')}` : name;
  }
  async function fetchPrediction(force){
    if(predictionPending) return; predictionPending = true; predictionFetched = true;
    const finalize = ()=>{ predictionRemain = PREDICTION_INTERVAL; predictionPending = false; updPredictionCd(); };
    try {
      const url = '/garden-keeper/api/predict' + (force ? '?force' : '');
      const resp = await fetch(url); if(!resp.ok) return finalize();
      const json = await resp.json();
      const payload = json.data ?? json.predictions ?? json.result ?? json;
      const list = Array.isArray(payload) ? payload
        : Array.isArray(payload?.items) ? payload.items
        : Array.isArray(payload?.forecast) ? payload.forecast
        : [];
      let text;
      if(list.length){
        text = list.slice(0, 25).map(renderPredictionEntry).join('\n');
      } else if(payload && typeof payload === 'object') {
        text = JSON.stringify(payload, null, 2);
      } else {
        text = 'No prediction data.';
      }
      const pre = document.getElementById('predictionPre');
      if(pre){ pre.textContent = text || 'No prediction data.'; }
      const ra = document.getElementById('predictionRefreshedAt');
      const ts = Date.now();
      if(ra){ ra.textContent = 'Refreshed at '+new Date(ts).toLocaleTimeString(); ra.setAttribute('data-refreshed-ts', ts); }
    } catch(e){} finally { finalize(); }
  }
  const predictionRefreshBtn = document.getElementById('predictionManualRefresh');
  const predictionToggleBtn = document.getElementById('predictionToggleAuto');
  if(predictionRefreshBtn) predictionRefreshBtn.addEventListener('click', ()=>fetchPrediction(true));
  if(predictionToggleBtn) predictionToggleBtn.addEventListener('click', ()=>{
    predictionActive = !predictionActive;
    predictionToggleBtn.textContent = predictionActive ? 'Pause' : 'Resume';
    if(predictionActive && predictionRemain <= 0) predictionRemain = 10;
  });

  function loop(){
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;
    if(stockActive){ stockRemain -= delta; if(stockRemain <= 0 && !stockPending) fetchStock(false); }
    if(merchantActive){ merchantRemain -= delta; if(merchantRemain <= 0 && !stockPending) fetchStock(false); }
    if(weatherActive){ weatherRemain -= delta; if(weatherRemain <= 0 && !weatherPending) fetchWeather(false); }
    if(foreverActive){ foreverRemain -= delta; if(foreverRemain <= 0 && !foreverPending) fetchForever(false); }
    if(predictionActive){ predictionRemain -= delta; if(predictionRemain <= 0 && !predictionPending) fetchPrediction(false); }
    updStockCd(); updWeatherCd(); updForeverCd(); updPredictionCd(); updateEventCountdowns(); applyLocalTimes();
    requestAnimationFrame(loop);
  }

  updStockCd(); updWeatherCd(); updForeverCd(); updPredictionCd(); updateEventCountdowns(); applyLocalTimes();
  setTimeout(()=>{
    if(!foreverFetched) fetchForever(false);
    if(!predictionFetched) fetchPrediction(false);
  }, 1200);
  requestAnimationFrame(loop);
})();
