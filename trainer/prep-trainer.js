/* Тренажёр по ТЭМ и препаратам: карточки (фото → название) и тест «узнай препарат».
   Данные — trainer/data.js (window.PT_DATA = {tem: [...], color: [...]}), у каждого препарата:
     name  — название как на фото / в источнике;
     imgs  — фото без подписей;
     group — группа похожих препаратов: из неё в первую очередь берутся неверные варианты;
     look  — 'em' для электронограмм среди цветных препаратов;
     html  — описание слово в слово из материалов. */
(function(){
  'use strict';
  var root = document.getElementById('panel-trainer');
  if(!root) return;

  function $(sel, el){ return (el || document).querySelector(sel); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }

  /* данные — trainer/data.js (window.PT_DATA): название и описание слово в слово из материалов */
  function load(kind){
    return ((window.PT_DATA || {})[kind] || []).map(function(d, i){
      return { id: kind + i, kind: kind, label: d.name, imgs: d.imgs, group: d.group || kind,
               look: d.look || (kind === 'tem' ? 'em' : 'light'), body: d.html };
    });
  }
  var SETS = { tem: load('tem'), color: load('color') };
  var ALL = SETS.tem.concat(SETS.color);
  var NAMES = { tem: 'ТЭМ', color: 'Препараты' };

  /* три неверных варианта: сначала из той же группы и того же вида снимка (ТЭМ / световая), потом того же раздела, без повторов названий */
  function options(item){
    var seen = {}, out = [];
    function key(x){ return x.label.replace(/\s*\(ультраструктура\)/i, '').replace(/ё/g, 'е').toLowerCase(); }  // одна и та же структура на ТЭМ и в препаратах
    seen[key(item)] = 1;
    function add(list){ shuffle(list).forEach(function(x){ if(out.length < 3 && !seen[key(x)]){ seen[key(x)] = 1; out.push(x); } }); }
    add(ALL.filter(function(x){ return x.group === item.group && x.look === item.look; }));
    add(ALL.filter(function(x){ return x.look === item.look && x.kind === item.kind; }));
    add(ALL.filter(function(x){ return x.look === item.look; }));
    add(ALL);
    return shuffle(out.concat([item]));
  }

  // ---------- стили ----------
  var css = '' +
    '.pt-bar{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;margin-bottom:12px;}' +
    '.pt-seg{display:inline-flex;gap:2px;padding:3px;background:var(--surface-2);border-radius:9px;border:1px solid var(--border);}' +
    '.pt-seg button{font:inherit;font-weight:600;font-size:.82rem;padding:6px 12px;border:none;border-radius:6px;background:transparent;color:var(--text-muted);cursor:pointer;}' +
    '.pt-seg button[aria-pressed="true"]{background:var(--surface);color:var(--accent);box-shadow:var(--shadow);}' +
    '.pt-seg button:focus-visible,.pt-btn:focus-visible,.pt-opt:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}' +
    '.pt-progress{display:flex;align-items:center;gap:12px;flex:1 1 220px;min-width:200px;font-family:"Atkinson Mono",monospace;font-size:.78rem;color:var(--text-muted);}' +
    '.pt-track{flex:1;height:4px;border-radius:4px;background:var(--surface-2);overflow:hidden;}' +
    '.pt-track i{display:block;height:100%;background:var(--accent);transition:width .25s ease;}' +
    '.pt-card{perspective:1600px;}' +
    '.pt-flip{display:grid;transition:transform .5s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d;}' +
    '.pt-card.flipped .pt-flip{transform:rotateY(180deg);}' +
    '.pt-face{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;}' +
    '.pt-back{transform:rotateY(180deg);}' +
    '.pt-card.flipped .pt-front,.pt-card:not(.flipped) .pt-back{pointer-events:none;}' +
    '.pt-photo{position:relative;display:flex;align-items:center;justify-content:center;padding:10px;min-height:200px;background:radial-gradient(120% 140% at 20% 0%,rgba(255,159,162,.10),transparent 55%),var(--surface-2);}' +
    '.pt-photo img{display:block;max-width:100%;max-height:max(220px,calc(100dvh - var(--pt-chrome,330px)));border-radius:8px;box-shadow:0 6px 20px -8px rgba(0,0,0,.6);}' +
    '.pt-zoom{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(236,244,255,.25);background:rgba(16,14,20,.65);color:var(--text);cursor:pointer;font-size:.95rem;}' +
    '.pt-hint{padding:9px 16px;color:var(--text-muted);font-size:.9rem;text-align:center;}' +
    '.pt-info{padding:18px 20px;}' +
    '.pt-thumb{float:right;width:96px;height:72px;object-fit:cover;border-radius:8px;margin:0 0 8px 12px;}' +
    '.pt-name{font-family:"Libre Caslon Cond",Georgia,serif;font-size:1.45rem;line-height:1.15;margin:0 0 4px;}' +
    '.pt-sub{color:var(--text-muted);font-size:.86rem;margin-bottom:10px;}' +
    'details.pt-desc{clear:both;border-top:1px dashed var(--border);margin-top:10px;padding-top:6px;}' +
    'details.pt-desc summary{cursor:pointer;font-weight:600;color:var(--accent);padding:6px 0;list-style:none;}' +
    'details.pt-desc summary::-webkit-details-marker{display:none;}' +
    'details.pt-desc summary::before{content:"▸ ";}' +
    'details.pt-desc[open] summary::before{content:"▾ ";}' +
    '.pt-desc ul,.pt-desc ol{margin:.3em 0 .6em;padding-left:1.2em;}.pt-desc li{margin-bottom:.2em;}.pt-desc p{margin:.45em 0;}' +
    '.pt-cap{font-style:italic;color:var(--text-muted);}.pt-leg{margin:.4em 0 .7em;font-size:.92rem;}.pt-leg div{margin:.1em 0;}.pt-src div{margin:.15em 0;}.pt-gap{height:.5em;}' +
    '.pt-actions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;}.pt-actions[hidden],.pt-result[hidden]{display:none;}' +
    '.pt-btn{font:inherit;font-weight:600;font-size:.93rem;padding:10px 16px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;flex:1;min-width:140px;}' +
    '.pt-btn:hover{border-color:var(--accent);}' +
    '.pt-btn.primary{background:var(--accent);border-color:var(--accent);color:#1A1216;}' +
    '.pt-btn.good{border-color:rgba(120,210,150,.55);}' +
    '.pt-btn.bad{border-color:rgba(255,120,120,.55);}' +
    '.pt-btn.ghost{flex:0 0 auto;min-width:0;color:var(--text-muted);}' +
    '.pt-card{cursor:pointer;}.pt-back details{cursor:auto;}.pt-back summary{cursor:pointer;}' +
    '.pt-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}' +
    '@media (max-width:600px){.pt-opts{grid-template-columns:1fr;}}' +
    '.pt-opt{font:inherit;font-size:.92rem;text-align:left;padding:10px 13px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;line-height:1.35;}' +
    '.pt-opt:hover:not([disabled]){border-color:var(--accent);}' +
    '.pt-opt[disabled]{cursor:default;}' +
    '.pt-opt.right{border-color:#6fcf97;background:rgba(111,207,151,.14);}' +
    '.pt-opt.wrong{border-color:#ff7a7a;background:rgba(255,122,122,.14);}' +
    '.pt-opt .k{font-family:"Atkinson Mono",monospace;color:var(--text-muted);margin-right:8px;font-size:.8rem;}' +
    '.pt-result{margin-top:10px;}' +
    '.pt-verdict{font-weight:600;margin-bottom:8px;}' +
    '.pt-verdict.ok{color:#6fcf97;}.pt-verdict.no{color:#ff7a7a;}' +
    '.pt-quiz{display:block;}' +
    '@media (min-width:900px){.pt-quiz{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:16px;align-items:start;}.pt-quiz .pt-opts{grid-template-columns:1fr;margin-top:0;}}' +
    '.pt-done{text-align:center;padding:26px 20px;}' +
    '.pt-done .big{font-family:"Libre Caslon Cond",Georgia,serif;font-size:2.2rem;margin:0 0 6px;}' +
    '.pt-miss{text-align:left;margin:16px 0 0;padding-left:1.2em;color:var(--text-muted);}' +
    '.pt-keys{font-family:"Atkinson Mono",monospace;font-size:.72rem;color:var(--text-muted);margin-top:10px;}' +
    '@media (hover:none){.pt-keys{display:none;}}' +
    '@media (prefers-reduced-motion:reduce){.pt-flip{transition:none;}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- состояние ----------
  var set = store('pt-set') in SETS ? store('pt-set') : 'tem';
  var mode = store('pt-mode') === 'test' ? 'test' : 'cards';
  var deck = [], pos = 0, stat = {}, current = null;

  root.innerHTML =
    '<div class="pt-bar">' +
      '<div class="pt-seg" role="group" aria-label="Раздел">' +
        '<button type="button" data-set="tem">ТЭМ · ' + SETS.tem.length + '</button>' +
        '<button type="button" data-set="color">Препараты · ' + SETS.color.length + '</button>' +
      '</div>' +
      '<div class="pt-seg" role="group" aria-label="Режим">' +
        '<button type="button" data-mode="cards">Карточки</button>' +
        '<button type="button" data-mode="test">Тест</button>' +
      '</div>' +
      '<div class="pt-progress"><span class="pt-count"></span><span class="pt-track"><i></i></span><span class="pt-score"></span></div>' +
    '</div>' +
    '<div class="pt-stage"></div>';
  var stage = $('.pt-stage', root);

  function syncBar(){
    root.querySelectorAll('[data-set]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.set === set)); });
    root.querySelectorAll('[data-mode]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
  }
  function progress(){
    $('.pt-count', root).textContent = Math.min(pos + 1, deck.length) + ' / ' + deck.length;
    $('.pt-track i', root).style.width = (deck.length ? pos / deck.length * 100 : 0) + '%';
    $('.pt-score', root).textContent = mode === 'test' ? ('верно ' + stat.ok + ' из ' + (stat.ok + stat.no)) : ('знаю ' + stat.ok);
  }
  function start(list){
    deck = shuffle(list || SETS[set]).map(function(it){ return {it: it, img: pick(it.imgs)}; });
    pos = 0; stat = {ok: 0, no: 0, miss: []};
    syncBar(); show();
  }
  function photo(src){
    return '<div class="pt-photo"><img src="' + esc(src) + '" alt="Препарат — угадай название">' +
      '<button type="button" class="pt-zoom" aria-label="Увеличить фото">⤢</button></div>';
  }
  function info(it, src, thumb){
    return '<div class="pt-info">' + (thumb ? '<img class="pt-thumb" src="' + esc(src) + '" alt="">' : '') +
      '<p class="pt-name">' + esc(it.label) + '</p>' +
      '<details class="pt-desc"><summary>Описание</summary>' + it.body + '</details></div>';
  }
  /* фото по высоте окна: всё остальное (шапка, переключатели, кнопки) измеряем, фото получает остаток */
  var wide = window.matchMedia('(min-width:900px)');
  function fit(){
    var img = $('.pt-photo img', stage); if(!img || !img.offsetHeight) return;
    var top = stage.getBoundingClientRect().top + window.scrollY;
    var box = (mode === 'test' && wide.matches) ? $('.pt-quiz .pt-face', stage) : stage;
    var other = box.offsetHeight - img.offsetHeight;
    root.style.setProperty('--pt-chrome', Math.round(top + other + 14) + 'px');
  }
  window.addEventListener('resize', fit);
  new MutationObserver(function(){ if(!root.hidden) fit(); }).observe(root, {attributes: true, attributeFilter: ['hidden']});
  function bindZoom(src){
    var im = $('.pt-photo img', stage);
    if(im){ if(im.complete) fit(); else im.addEventListener('load', fit); }
    var z = $('.pt-zoom', stage);
    if(z) z.addEventListener('click', function(e){ e.stopPropagation(); if(window.openLightbox) window.openLightbox(src, ''); });
  }

  function show(){
    progress();
    if(pos >= deck.length) return finish();
    current = deck[pos];
    var it = current.it, src = current.img;
    if(mode === 'cards'){
      stage.innerHTML =
        '<div class="pt-card"><div class="pt-flip">' +
          '<div class="pt-face pt-front">' + photo(src) + '<div class="pt-hint">Вспомни название и нажми на фото</div></div>' +
          '<div class="pt-face pt-back" aria-hidden="true">' + info(it, src, true) + '</div>' +
        '</div></div>' +
        '<div class="pt-actions pt-a1"><button type="button" class="pt-btn primary" data-act="flip">Перевернуть</button></div>' +
        '<div class="pt-actions pt-a2" hidden><button type="button" class="pt-btn ghost" data-act="flip" aria-label="Перевернуть карточку">↺ Перевернуть</button><button type="button" class="pt-btn bad" data-act="no">Не знал</button><button type="button" class="pt-btn good" data-act="yes">Знал</button></div>' +
        '<div class="pt-keys">Пробел — перевернуть · 1 — не знал · 2 — знал</div>';
      bindZoom(src);
    } else {
      var opts = options(it);
      stage.innerHTML =
        '<div class="pt-quiz"><div class="pt-face" style="position:relative">' + photo(src) + '</div><div class="pt-side">' +
        '<div class="pt-opts">' + opts.map(function(o, i){
          return '<button type="button" class="pt-opt" data-ok="' + (o === it ? 1 : 0) + '"><span class="k">' + (i + 1) + '</span>' + esc(o.label) + '</button>';
        }).join('') + '</div>' +
        '<div class="pt-result" hidden></div>' +
        '<div class="pt-keys">1–4 — выбрать ответ · Enter — дальше</div></div></div>';
      bindZoom(src);
    }
  }
  function flip(){
    var c = $('.pt-card', stage); if(!c) return;
    var toBack = !c.classList.contains('flipped');
    c.classList.toggle('flipped', toBack);
    $('.pt-front', stage).setAttribute('aria-hidden', String(toBack));
    $('.pt-back', stage).setAttribute('aria-hidden', String(!toBack));
    $('.pt-a1', stage).hidden = true; $('.pt-a2', stage).hidden = false;   // после первого переворота можно листать туда-обратно и оценить
  }
  function rate(knew){
    if(knew) stat.ok++; else { stat.no++; stat.miss.push(current.it); deck.push({it: current.it, img: pick(current.it.imgs)}); }
    pos++; show();
  }
  function answer(btn){
    if(!btn || btn.disabled) return;
    var ok = btn.dataset.ok === '1';
    stage.querySelectorAll('.pt-opt').forEach(function(b){ b.disabled = true; if(b.dataset.ok === '1') b.classList.add('right'); });
    if(!ok) btn.classList.add('wrong');
    if(ok) stat.ok++; else { stat.no++; stat.miss.push(current.it); }
    var r = $('.pt-result', stage);
    r.innerHTML = '<div class="pt-face">' +
      '<div class="pt-info"><div class="pt-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Верно' : 'Неверно') + '</div>' +
      info(current.it, current.img, false).replace('<div class="pt-info">', '').replace(/<\/div>$/, '') + '</div></div>' +
      '<div class="pt-actions"><button type="button" class="pt-btn primary" data-act="next">Дальше</button></div>';
    r.hidden = false;
    progress();
    var n = $('[data-act="next"]', r); n.focus({preventScroll: true});
    r.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  }
  function finish(){
    var total = mode === 'test' ? stat.ok + stat.no : SETS[set].length;
    var miss = [], seen = {};
    stat.miss.forEach(function(it){ if(!seen[it.id]){ seen[it.id] = 1; miss.push(it); } });
    stage.innerHTML = '<div class="pt-face pt-done">' +
      '<p class="big">' + (mode === 'test' ? stat.ok + ' из ' + total : 'Колода пройдена') + '</p>' +
      '<div class="pt-sub">' + (mode === 'test' ? 'правильных ответов' : (miss.length ? 'Не узнал с первого раза: ' + miss.length : 'Все узнал с первого раза')) + '</div>' +
      (miss.length ? '<ol class="pt-miss">' + miss.map(function(it){ return '<li>' + esc(it.label) + '</li>'; }).join('') + '</ol>' : '') +
      '<div class="pt-actions">' + (miss.length ? '<button type="button" class="pt-btn primary" data-act="miss">Повторить ошибки (' + miss.length + ')</button>' : '') +
      '<button type="button" class="pt-btn" data-act="again">Заново</button></div></div>';
    stage._miss = miss;
    $('.pt-track i', root).style.width = '100%';
  }

  root.addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b || !root.contains(b)) return;
    if(b.dataset.set){ set = b.dataset.set; store('pt-set', set); start(); }
    else if(b.dataset.mode){ mode = b.dataset.mode; store('pt-mode', mode); start(); }
    else if(b.classList.contains('pt-opt')) answer(b);
    else if(b.dataset.act === 'flip') flip();
    else if(b.dataset.act === 'yes') rate(true);
    else if(b.dataset.act === 'no') rate(false);
    else if(b.dataset.act === 'next'){ pos++; show(); }
    else if(b.dataset.act === 'again') start();
    else if(b.dataset.act === 'miss') start(stage._miss);
  });
  stage.addEventListener('click', function(e){
    if(mode === 'cards' && e.target.closest('.pt-card') && !e.target.closest('.pt-zoom, details')) flip();
  });
  document.addEventListener('keydown', function(e){
    if(root.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var lb = document.getElementById('lightbox'); if(lb && !lb.hidden) return;
    if(mode === 'cards'){
      var seen = $('.pt-a2', stage) && !$('.pt-a2', stage).hidden;
      if(e.key === ' ' && $('.pt-card', stage)){ if(document.activeElement.closest && document.activeElement.closest('#panel-trainer button')) return; e.preventDefault(); flip(); }
      else if(seen && e.key === '1') rate(false);
      else if(seen && e.key === '2') rate(true);
    } else {
      var opts = stage.querySelectorAll('.pt-opt');
      if(/^[1-4]$/.test(e.key) && opts[+e.key - 1]) answer(opts[+e.key - 1]);
      else if(e.key === 'Enter' && $('[data-act="next"]', stage) && document.activeElement.dataset.act !== 'next'){ e.preventDefault(); pos++; show(); }
    }
  });

  start();
})();
