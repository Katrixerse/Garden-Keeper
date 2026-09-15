(function(){
  function el(id){ return document.getElementById(id); }
  function boolVal(id){ return el(id)?.value === 'true'; }
  function isTrue(v){
    if(typeof v === 'string'){ return ['true','1','on','yes','enabled'].includes(v.toLowerCase()); }
    return v === true || v === 1;
  }
  function setBoolSelect(id, value){
    const node = el(id);
    if(!node) return;
    node.value = isTrue(value) ? 'true' : 'false';
  }
  function setFieldValue(id, value){
    const node = el(id);
    if(!node) return;
    node.value = value == null ? '' : String(value);
  }

  async function hydrateSettings(){
    const btn = el('saveGuildSettings');
    if(!btn) return;
    const basePath = window.location.pathname.replace(/\/$/, '');
    const url = `${basePath}/settings`;
    try{
      const resp = await fetch(url, { headers:{ 'Accept':'application/json' } });
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const settings = payload?.settings || {};
      setFieldValue('setPrefix', settings.prefix || '!');
      setBoolSelect('setLeveling', settings.leveling);
      setBoolSelect('setRolePersist', settings.rolePersist);
      setBoolSelect('setServerStats', settings.serverStats);
      setBoolSelect('setServerCash', settings.serverCash);
      setBoolSelect('setModOnly', settings.modOnlyCommands);
      setBoolSelect('setServerCaptcha', settings.serverCaptcha);
      setBoolSelect('setModLogsEnabled', settings.modLogsEnabled);
      setFieldValue('setModLogsChannel', settings.modLogsChannelId || '');
      setBoolSelect('setChatLogsEnabled', settings.chatLogsEnabled);
      setFieldValue('setChatLogsChannel', settings.chatLogsChannelId || '');
      setFieldValue('setStockChannel', settings.stockChannelId || '');
      setFieldValue('setEggChannel', settings.eggChannelId || '');
      setFieldValue('setEventChannel', settings.eventChannelId || '');
      setFieldValue('setMerchantChannel', settings.merchantChannelId || '');
      setFieldValue('setCosmeticsChannel', settings.cosmeticsChannelId || '');
      setFieldValue('setWeatherChannel', settings.weatherChannelId || '');
      setFieldValue('setDisabledEvents', settings.disabledEvents || '');
    } catch(err){
      console.warn('[dashboard] Failed to hydrate settings', err);
    }
  }

  async function save(){
    const btn = el('saveGuildSettings'); if(!btn) return;
    const gid = btn.getAttribute('data-gid');
    btn.disabled = true; btn.textContent = 'Saving...';
    try{
      const payload = {
        prefix: el('setPrefix')?.value?.trim() || '!',
        leveling: boolVal('setLeveling'),
        rolePersist: boolVal('setRolePersist'),
        serverStats: boolVal('setServerStats'),
        serverCash: boolVal('setServerCash'),
        modOnlyCommands: boolVal('setModOnly'),
        serverCaptcha: boolVal('setServerCaptcha'),
        modLogsEnabled: boolVal('setModLogsEnabled'),
        modLogsChannelId: el('setModLogsChannel')?.value?.trim() || '',
        chatLogsEnabled: boolVal('setChatLogsEnabled'),
        chatLogsChannelId: el('setChatLogsChannel')?.value?.trim() || '',
        stockChannelId: el('setStockChannel')?.value?.trim() || '',
        eggChannelId: el('setEggChannel')?.value?.trim() || '',
        eventChannelId: el('setEventChannel')?.value?.trim() || '',
        merchantChannelId: el('setMerchantChannel')?.value?.trim() || '',
        cosmeticsChannelId: el('setCosmeticsChannel')?.value?.trim() || '',
        weatherChannelId: el('setWeatherChannel')?.value?.trim() || '',
        disabledEvents: el('setDisabledEvents')?.value?.trim() || ''
      };
      const r = await fetch(`/garden-keeper/dashboard/${gid}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const j = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error||'Save failed');
      btn.textContent = 'Saved!';
      setTimeout(()=>{ btn.textContent='Save Changes'; btn.disabled=false; }, 1400);
    }catch(e){
      console.warn(e);
      btn.textContent = 'Error';
      setTimeout(()=>{ btn.textContent='Save Changes'; btn.disabled=false; }, 1400);
    }
  }

  function wireSave(){
    const btn = el('saveGuildSettings');
    if(btn) btn.addEventListener('click', save);
  }

  function wireSearch(){
    const input = el('guildSearch');
    if(!input) return;
    const cards = Array.from(document.querySelectorAll('.gk-guild-card'));
    const update = ()=>{
      const q = input.value.trim().toLowerCase();
      if(!q){ cards.forEach(card => card.style.display=''); return; }
      cards.forEach(card => {
        const name = card.getAttribute('data-guild-name') || '';
        card.style.display = name.includes(q) ? '' : 'none';
      });
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  }

  function init(){ hydrateSettings(); wireSave(); wireSearch(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
