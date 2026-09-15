(function(){
  if(!document.getElementById('petsSection')) return;

  function rarityClass(r){ const k=String(r||'').toLowerCase(); return 'rarity-'+k.replace(/\s+/g,'-'); }
  function setResultHtml(id, html){ const el=document.getElementById(id); if(!el) return; el.innerHTML = html; }
  function copyEl(id){ const el=document.getElementById(id); if(!el) return; const tmp=document.createElement('textarea'); tmp.value=el.innerText; document.body.appendChild(tmp); tmp.select(); try{ document.execCommand('copy'); }catch{} document.body.removeChild(tmp); }

  async function loadMeta(){
    try { const r = await fetch('/garden-keeper/api/pets'); if(!r.ok) return []; const j=await r.json(); return Array.isArray(j.pets)? j.pets : []; } catch { return []; }
  }

  async function init(){
    // If options already present, we rely on server render; otherwise we can populate if needed in future.
    const metaList = await loadMeta();
    const byName = Object.fromEntries(metaList.map(m=>[String(m.name||'').toLowerCase(), m]));
    function findMeta(){ const key=(document.getElementById('petName')?.value||'').toLowerCase(); return byName[key] || null; }

    function updateHead(){
      const m = findMeta();
      const title=document.getElementById('petTitle'); const icon=document.getElementById('petIcon'); const rar=document.getElementById('petRarity'); const typ=document.getElementById('petType');
      if(!m){ if(title) title.textContent='Select a pet'; if(icon){ icon.src=''; icon.style.display='none'; } if(rar){ rar.textContent=''; rar.className='badge'; } if(typ) typ.textContent=''; return; }
      if(title) title.textContent=m.name;
      if(rar){ rar.textContent=m.rarity||''; rar.className='badge '+rarityClass(m.rarity); }
      if(typ) typ.textContent=m.type||'';
      if(icon){ if(m.icon && m.icon.url){ icon.src=m.icon.url; icon.style.display='block'; } else { icon.removeAttribute('src'); icon.style.display='none'; } }
    }

  function syncPair(pair){
    const [num, slider] = pair;
    const n=document.getElementById(num), s=document.getElementById(slider);
    if(!n||!s) return;
    n.addEventListener('input',()=>{ const val = Number(n.value)||0; s.value = String(Math.max(Number(s.min), Math.min(Number(s.max), val))); });
    s.addEventListener('input',()=>{ n.value = String(s.value); });
  }
  syncPair(['petWeight','petWeightSlider']);
  syncPair(['petAge','petAgeSlider']);
  syncPair(['pet2Weight','pet2WeightSlider']);
  syncPair(['pet2Age','pet2AgeSlider']);

    const petNameSel = document.getElementById('petName'); if(petNameSel) petNameSel.addEventListener('change', updateHead);
    updateHead();
    const pet2Sel = document.getElementById('pet2Name'); if(pet2Sel) pet2Sel.addEventListener('change',()=>{ const v=document.getElementById('pet2Name').value; const grid=document.getElementById('compareGrid'); if(grid) grid.style.opacity=v?1:0.6; });

  // Remove main toggle: force dropdown usage and hide switch button if present
    (function(){
      const sel = document.getElementById('petName');
      const btn = document.getElementById('togglePetInput');
      if (btn) btn.style.display = 'none';
      if (sel) sel.classList.remove('gk-hidden');
    })();

    // Remove redundant second text search: keep compare as dropdown only and hide related controls if present
    (function(){
      const compBtn = document.getElementById('togglePet2Input');
      if(compBtn) compBtn.style.display = 'none';
    })();

    // Search filtering
  function filterSelect(inputEl, selectEl){
      if(!inputEl || !selectEl) return;
      const all = Array.from(selectEl.options).map(o=>({ value:o.value, text:o.text }));
      function apply(){
        const t = (inputEl.value||'').toLowerCase().trim();
        const list = t ? all.filter(o=>o.text.toLowerCase().includes(t)) : all;
        const cur = selectEl.value;
        selectEl.innerHTML = list.map(o=>`<option value="${o.value}">${o.text}</option>`).join('');
        if(list.some(o=>o.value===cur)) selectEl.value = cur; else if(list.length) selectEl.value = list[0].value;
        if(selectEl === petNameSel) updateHead();
      }
      inputEl.addEventListener('input', apply);
    }
    filterSelect(document.getElementById('petSearch'), petNameSel);
  // No second text search; keep compare select only

    async function calc(){
      const btn = document.getElementById('petsCalcBtn'); if(btn){ btn.disabled = true; btn.textContent = 'Calculating...'; }
      const pet=document.getElementById('petName').value; const w=Number(document.getElementById('petWeight').value)||0; const age=Number(document.getElementById('petAge').value)||0; const mod=document.getElementById('petModifier').value||'none';
      const pet2=document.getElementById('pet2Name').value; const w2=Number(document.getElementById('pet2Weight').value)||0; const age2=Number(document.getElementById('pet2Age').value)||0; const mod2=document.getElementById('pet2Modifier').value||'';
      try {
        const r=await fetch('/garden-keeper/api/pets/calc',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pet, weight:w, age, modifier:mod, pet2, weight2:w2, age2, modifier2:mod2||undefined }) });
        if(!r.ok){ let errText='Request failed ('+r.status+')'; try { const je=await r.json(); if(je?.error) errText=je.error; } catch {} setResultHtml('petsResult','Error: '+errText); setResultHtml('petsResult2','(none)'); return; }
        const ct=r.headers.get('content-type')||''; const j=ct.includes('application/json')? await r.json() : { error:'Invalid response' };
        setResultHtml('petsResult', j.result || j.error || 'No result');
        setResultHtml('petsResult2', j.result2 || '(none)');
      } catch(e){ console.warn('pet calc error:', e); setResultHtml('petsResult','Error performing calculation.'); setResultHtml('petsResult2','(none)'); }
      finally { if(btn){ btn.disabled = false; btn.textContent = 'Calculate'; } }
    }
    const calcBtn=document.getElementById('petsCalcBtn'); if(calcBtn) calcBtn.addEventListener('click', calc);
    const resetBtn=document.getElementById('petsResetBtn'); if(resetBtn) resetBtn.addEventListener('click', ()=>{ document.getElementById('petWeight').value=50; document.getElementById('petWeightSlider').value=50; document.getElementById('pet2Name').value=''; document.getElementById('pet2Weight').value=50; document.getElementById('pet2WeightSlider').value=50; document.getElementById('pet2Modifier').value=''; setResultHtml('petsResult','Pick a pet and click Calculate.'); setResultHtml('petsResult2','Optional second pet comparison.'); updateHead(); });
    const copy1=document.getElementById('copyResult'); if(copy1) copy1.addEventListener('click', ()=>copyEl('petsResult'));
    const copy2=document.getElementById('copyResult2'); if(copy2) copy2.addEventListener('click', ()=>copyEl('petsResult2'));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
