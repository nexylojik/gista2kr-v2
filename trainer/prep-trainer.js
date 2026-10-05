/* Тренажёр по ТЭМ и препаратам: карточки (фото → название) и тест «узнай препарат».
   Данные берутся из карточек атласа (#panel-tem, #panel-color):
     data-short — короткое название для ответа (иначе берётся заголовок карточки);
     data-group — группа похожих препаратов: из неё в первую очередь берутся неверные варианты;
     data-look  — 'em' для электронограмм среди цветных препаратов (варианты тогда тоже электронограммы);
     data-clean — фото без подписей (иначе берутся фото из карточки). */
(function(){
  'use strict';
  var root = document.getElementById('panel-trainer');
  if(!root) return;

  function $(sel, el){ return (el || document).querySelector(sel); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }

  function collect(panelId, kind){
    return [].map.call(document.querySelectorAll('#' + panelId + ' .prep-card'), function(c, i){
      var imgs = c.dataset.clean ? c.dataset.clean.split('|') : [].map.call(c.querySelectorAll('.prep-img img'), function(m){ return m.getAttribute('src'); });
      var body = c.querySelector('.prep-body').cloneNode(true);
      var t = body.querySelector('.prep-title'), title = t ? t.textContent.trim() : '';
      if(t) t.remove();
      var g = c.closest('.qgroup'), h = g && g.querySelector('h2');
      return {
        id: kind + i, kind: kind, title: title, label: c.dataset.short || title, imgs: imgs,
        group: c.dataset.group || (h ? h.textContent.trim() : kind),
        look: c.dataset.look || (kind === 'tem' ? 'em' : 'light'), body: body.innerHTML
      };
    });
  }
  var SETS = { tem: collect('panel-tem', 'tem'), color: collect('panel-color', 'color') };
  var ALL = SETS.tem.concat(SETS.color);
  var NAMES = { tem: 'ТЭМ', color: 'Препараты' };

  /* три неверных варианта: сначала из той же группы и того же вида снимка (ТЭМ / световая), потом того же раздела, без повторов названий */
  function options(item){
    var seen = {}, out = [];
    function key(x){ return x.label.replace(/\s*\(ультраструктура\)/i, '').toLowerCase(); }  // одна и та же структура на ТЭМ и в препаратах
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
    '.pt-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px;}' +
    '.pt-seg{display:inline-flex;gap:2px;padding:3px;background:var(--surface-2);border-radius:9px;border:1px solid var(--border);}' +
    '.pt-seg button{font:inherit;font-weight:600;font-size:.85rem;padding:7px 14px;border:none;border-radius:6px;background:transparent;color:var(--text-muted);cursor:pointer;}' +
    '.pt-seg button[aria-pressed="true"]{background:var(--surface);color:var(--accent);box-shadow:var(--shadow);}' +
    '.pt-seg button:focus-visible,.pt-btn:focus-visible,.pt-opt:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}' +
    '.pt-progress{display:flex;align-items:center;gap:12px;margin-bottom:12px;font-family:"Atkinson Mono",monospace;font-size:.78rem;color:var(--text-muted);}' +
    '.pt-track{flex:1;height:4px;border-radius:4px;background:var(--surface-2);overflow:hidden;}' +
    '.pt-track i{display:block;height:100%;background:var(--accent);transition:width .25s ease;}' +
    '.pt-card{perspective:1600px;}' +
    '.pt-flip{display:grid;transition:transform .5s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d;}' +
    '.pt-card.flipped .pt-flip{transform:rotateY(180deg);}' +
    '.pt-face{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;}' +
    '.pt-back{transform:rotateY(180deg);}' +
    '.pt-photo{position:relative;display:flex;align-items:center;justify-content:center;padding:14px;min-height:260px;background:radial-gradient(120% 140% at 20% 0%,rgba(255,159,162,.10),transparent 55%),var(--surface-2);}' +
    '.pt-photo img{display:block;max-width:100%;max-height:min(62vh,560px);border-radius:8px;box-shadow:0 6px 20px -8px rgba(0,0,0,.6);}' +
    '.pt-zoom{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(236,244,255,.25);background:rgba(16,14,20,.65);color:var(--text);cursor:pointer;font-size:.95rem;}' +
    '.pt-hint{padding:14px 18px;color:var(--text-muted);font-size:.9rem;text-align:center;}' +
    '.pt-info{padding:18px 20px;}' +
    '.pt-thumb{float:right;width:96px;height:72px;object-fit:cover;border-radius:8px;margin:0 0 8px 12px;}' +
    '.pt-name{font-family:"Libre Caslon Cond",Georgia,serif;font-size:1.45rem;line-height:1.15;margin:0 0 4px;}' +
    '.pt-sub{color:var(--text-muted);font-size:.86rem;margin-bottom:10px;}' +
    'details.pt-desc{clear:both;border-top:1px dashed var(--border);margin-top:10px;padding-top:6px;}' +
    'details.pt-desc summary{cursor:pointer;font-weight:600;color:var(--accent);padding:6px 0;list-style:none;}' +
    'details.pt-desc summary::-webkit-details-marker{display:none;}' +
    'details.pt-desc summary::before{content:"▸ ";}' +
    'details.pt-desc[open] summary::before{content:"▾ ";}' +
    'details.pt-desc .prep-note{border-top:none;padding-top:4px;}' +
    '.pt-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;}' +
    '.pt-btn{font:inherit;font-weight:600;font-size:.95rem;padding:12px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;flex:1;min-width:140px;}' +
    '.pt-btn:hover{border-color:var(--accent);}' +
    '.pt-btn.primary{background:var(--accent);border-color:var(--accent);color:#1A1216;}' +
    '.pt-btn.good{border-color:rgba(120,210,150,.55);}' +
    '.pt-btn.bad{border-color:rgba(255,120,120,.55);}' +
    '.pt-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}' +
    '@media (max-width:600px){.pt-opts{grid-template-columns:1fr;}}' +
    '.pt-opt{font:inherit;font-size:.95rem;text-align:left;padding:13px 15px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;line-height:1.35;}' +
    '.pt-opt:hover:not([disabled]){border-color:var(--accent);}' +
    '.pt-opt[disabled]{cursor:default;}' +
    '.pt-opt.right{border-color:#6fcf97;background:rgba(111,207,151,.14);}' +
    '.pt-opt.wrong{border-color:#ff7a7a;background:rgba(255,122,122,.14);}' +
    '.pt-opt .k{font-family:"Atkinson Mono",monospace;color:var(--text-muted);margin-right:8px;font-size:.8rem;}' +
    '.pt-result{margin-top:14px;}' +
    '.pt-verdict{font-weight:600;margin-bottom:8px;}' +
    '.pt-verdict.ok{color:#6fcf97;}.pt-verdict.no{color:#ff7a7a;}' +
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
    '<p class="intro">Учим препараты по фото без подписей. <b>Карточки</b>: смотришь фото, вспоминаешь название и переворачиваешь. <b>Тест</b>: выбираешь название из четырёх похожих вариантов. Описание открывается после ответа.</p>' +
    '<div class="pt-bar">' +
      '<div class="pt-seg" role="group" aria-label="Раздел">' +
        '<button type="button" data-set="tem">ТЭМ · ' + SETS.tem.length + '</button>' +
        '<button type="button" data-set="color">Препараты · ' + SETS.color.length + '</button>' +
      '</div>' +
      '<div class="pt-seg" role="group" aria-label="Режим">' +
        '<button type="button" data-mode="cards">Карточки</button>' +
        '<button type="button" data-mode="test">Тест</button>' +
      '</div>' +
    '</div>' +
    '<div class="pt-progress"><span class="pt-count"></span><span class="pt-track"><i></i></span><span class="pt-score"></span></div>' +
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
      (it.title && it.title !== it.label ? '<div class="pt-sub">' + esc(it.title) + '</div>' : '') +
      '<details class="pt-desc"><summary>Описание</summary>' + it.body + '</details></div>';
  }
  function bindZoom(src){
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
          '<div class="pt-face pt-front">' + photo(src) + '<div class="pt-hint">Вспомни название и нажми «Перевернуть»</div></div>' +
          '<div class="pt-face pt-back" aria-hidden="true">' + info(it, src, true) + '</div>' +
        '</div></div>' +
        '<div class="pt-actions pt-a1"><button type="button" class="pt-btn primary" data-act="flip">Перевернуть</button></div>' +
        '<div class="pt-actions pt-a2" hidden><button type="button" class="pt-btn bad" data-act="no">Не знал</button><button type="button" class="pt-btn good" data-act="yes">Знал</button></div>' +
        '<div class="pt-keys">Пробел — перевернуть · 1 — не знал · 2 — знал</div>';
      bindZoom(src);
    } else {
      var opts = options(it);
      stage.innerHTML =
        '<div class="pt-face" style="position:relative">' + photo(src) + '</div>' +
        '<div class="pt-opts">' + opts.map(function(o, i){
          return '<button type="button" class="pt-opt" data-ok="' + (o === it ? 1 : 0) + '"><span class="k">' + (i + 1) + '</span>' + esc(o.label) + '</button>';
        }).join('') + '</div>' +
        '<div class="pt-result" hidden></div>' +
        '<div class="pt-keys">1–4 — выбрать ответ · Enter — дальше</div>';
      bindZoom(src);
    }
  }
  function flip(){
    var c = $('.pt-card', stage); if(!c || c.classList.contains('flipped')) return;
    c.classList.add('flipped');
    $('.pt-front', stage).setAttribute('aria-hidden', 'true'); $('.pt-back', stage).removeAttribute('aria-hidden');
    $('.pt-a1', stage).hidden = true; $('.pt-a2', stage).hidden = false;
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
    if(mode === 'cards' && e.target.closest('.pt-front') && !e.target.closest('.pt-zoom')) flip();
  });
  document.addEventListener('keydown', function(e){
    if(root.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var lb = document.getElementById('lightbox'); if(lb && !lb.hidden) return;
    if(mode === 'cards'){
      var flipped = $('.pt-card.flipped', stage);
      if(e.key === ' ' && $('.pt-card', stage) && !flipped){ e.preventDefault(); flip(); }
      else if(flipped && e.key === '1') rate(false);
      else if(flipped && e.key === '2') rate(true);
    } else {
      var opts = stage.querySelectorAll('.pt-opt');
      if(/^[1-4]$/.test(e.key) && opts[+e.key - 1]) answer(opts[+e.key - 1]);
      else if(e.key === 'Enter' && $('[data-act="next"]', stage) && document.activeElement.dataset.act !== 'next'){ e.preventDefault(); pos++; show(); }
    }
  });

  start();
})();
