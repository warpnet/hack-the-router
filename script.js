(function () {
  // Blueprint pointer spotlight: brighten the header's grid near the cursor.
  // Progressive enhancement; the header renders fine without it, and it stays
  // off when the visitor prefers reduced motion.
  const header = document.querySelector('header');
  if (!header) return;

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  header.addEventListener('pointermove', (e) => {
    const r = header.getBoundingClientRect();
    header.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    header.style.setProperty('--my', (e.clientY - r.top) + 'px');
    header.classList.add('bp-hot');
  });
  header.addEventListener('pointerleave', () => header.classList.remove('bp-hot'));
})();

(function () {
  // Challenge checklist + running score. Ticks are persisted per device;
  // localStorage may be blocked (private mode, cleared storage), so every
  // access is guarded and the checklist works fine without it.
  const boxes = document.querySelectorAll('ul.mission input[type="checkbox"]');
  if (!boxes.length) return;

  const KEY = 'wr841n-workshop-tasks-v1';
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  };
  const write = (arr) => {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  };
  const clear = () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
  };

  // Score panel elements (optional; the checklist runs without them).
  const el = (id) => document.getElementById(id);
  const totalEl = el('scoreTotal'), maxEl = el('scoreMax'), fillEl = el('scoreFill'),
        countEl = el('scoreCount'), ofEl = el('scoreOf'), rankEl = el('scoreRank'),
        resetEl = el('scoreReset'), celebEl = el('celebration'), confettiEl = el('confetti');

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Confetti burst on 100% completion (the "you cracked it" moment).
  const COLORS = ['#96aff5', '#ffffff', '#000090', '#c9d2ee'];
  let confettiActive = false;
  function burstConfetti() {
    if (!confettiEl || prefersReduced || confettiActive) return;
    confettiActive = true;
    for (let i = 0; i < 90; i++) {
      const piece = document.createElement('span');
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.animationDuration = (2.4 + Math.random() * 2.4) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      if (Math.random() < 0.5) { piece.style.width = '6px'; piece.style.height = '10px'; }
      confettiEl.appendChild(piece);
      setTimeout(() => piece.remove(), 6000);
    }
    setTimeout(() => { confettiActive = false; }, 1200);
  }

  // Read each task's points from its .pts label; max scales with the tasks present.
  let max = 0;
  boxes.forEach((cb, i) => {
    cb.dataset.idx = i;
    const pts = cb.parentElement.querySelector('.pts');
    const n = pts ? (parseInt(pts.textContent.replace(/[^0-9]/g, ''), 10) || 0) : 0;
    cb.dataset.pts = n;
    max += n;
  });
  if (maxEl) maxEl.textContent = max;
  if (ofEl) ofEl.textContent = boxes.length;

  // Ranks keyed on fraction of max, so they stay sane as challenges are added.
  const ranks = [
    [0,    'SCREWDRIVER ROOKIE'],
    [0.20, 'PROBE JOCKEY'],
    [0.40, 'UART WHISPERER'],
    [0.60, 'BOOTLOADER BANDIT'],
    [0.80, 'FLASH RIPPER'],
    [1,    'FIRMWARE OVERLORD']
  ];
  const rankFor = (frac) => {
    let r = ranks[0][1];
    for (const [t, name] of ranks) if (frac >= t) r = name;
    return r;
  };

  const saved = new Set(read());
  boxes.forEach((cb, i) => { if (saved.has(i)) cb.checked = true; });

  // Seed from the restored state so a page that loads already-complete shows the
  // banner but does not re-fire confetti; confetti only fires on a live transition.
  let wasMaxed = (() => {
    let t = 0;
    boxes.forEach((cb) => { if (cb.checked) t += +cb.dataset.pts; });
    return max > 0 && t === max;
  })();

  function update() {
    let total = 0, count = 0;
    const checked = [];
    boxes.forEach((cb, i) => {
      if (cb.checked) { total += +cb.dataset.pts; count++; checked.push(i); }
    });
    const maxed = max > 0 && total === max;
    if (totalEl) {
      totalEl.textContent = total;
      totalEl.classList.toggle('maxed', maxed);
    }
    if (countEl) countEl.textContent = count;
    if (fillEl) fillEl.style.width = max ? (total / max * 100) + '%' : '0%';
    if (rankEl) rankEl.textContent = rankFor(max ? total / max : 0);
    if (celebEl) celebEl.classList.toggle('show', maxed);
    if (maxed && !wasMaxed) burstConfetti();
    wasMaxed = maxed;
    write(checked);
  }

  boxes.forEach((cb) => cb.addEventListener('change', update));
  if (resetEl) {
    resetEl.addEventListener('click', () => {
      if (window.confirm('Clear all ticked objectives?')) {
        boxes.forEach((cb) => { cb.checked = false; });
        clear();
        update();
      }
    });
  }

  update();
})();
