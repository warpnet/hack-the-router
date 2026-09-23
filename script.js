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

  // Confetti burst on 100% completion (the "you cracked it" moment), made of
  // blueprint bits: hex bytes, 0/1 bits, solder pads and tiny SOIC-8 chips.
  const COLORS = ['#96aff5', '#96aff5', '#ffffff', '#c9d2ee', '#f0b46a'];
  const BYTES = ['FF', '00', '7E', '27', '05', '19', '56', 'DE', 'AD', 'BE', 'EF', '0x', '1', '0', '1', '0'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let confettiActive = false;
  function burstConfetti() {
    if (!confettiEl || prefersReduced || confettiActive) return;
    confettiActive = true;
    for (let i = 0; i < 90; i++) {
      const piece = document.createElement('span');
      const r = Math.random();
      piece.className = r < 0.55 ? 'bit' : r < 0.8 ? 'pad' : 'chip';
      if (piece.className === 'bit') piece.textContent = pick(BYTES);
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.color = pick(COLORS);
      piece.style.animationDuration = (2.4 + Math.random() * 2.4) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      piece.style.setProperty('--spin', (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 270) + 'deg');
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

(function () {
  // Hex "decrypt" on the title and section headings: letters start as random
  // hex and resolve left to right. Text nodes only, so <br>, <b>, etc. survive.
  // Skipped entirely when the visitor prefers reduced motion.
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const HEX = '0123456789ABCDEF';
  function decrypt(el, duration) {
    if (el.dataset.decrypting) return;
    el.dataset.decrypting = '1';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
    const total = nodes.reduce((n, t) => n + t.text.length, 0);
    const start = performance.now();
    function frame(now) {
      const done = Math.min(1, (now - start) / duration);
      let revealed = Math.floor(done * total);
      nodes.forEach((t) => {
        let out = '';
        for (const ch of t.text) {
          if (revealed > 0 || /\s/.test(ch)) out += ch;
          else out += HEX[Math.floor(Math.random() * 16)];
          revealed--;
        }
        t.node.nodeValue = out;
      });
      if (done < 1) requestAnimationFrame(frame);
      else delete el.dataset.decrypting;
    }
    requestAnimationFrame(frame);
  }

  const h1 = document.querySelector('header h1');
  if (h1) {
    decrypt(h1, 900);
    h1.addEventListener('pointerenter', () => decrypt(h1, 600));
  }

  const headings = document.querySelectorAll('h2');
  if ('IntersectionObserver' in window && headings.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        decrypt(e.target, 650);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    headings.forEach((h) => io.observe(h));
  }
})();

(function () {
  // Scroll progress as an SPI flash dump: the TL-WR841N v14 has a 4 MiB flash
  // (0x400000), so the readout shows how far into the "image" you have read.
  const FLASH = 0x400000;
  const bar = document.createElement('div');
  bar.className = 'dump-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span class="dump-fill"></span><span class="dump-addr"></span>';
  document.body.appendChild(bar);
  const fill = bar.querySelector('.dump-fill');
  const addr = bar.querySelector('.dump-addr');
  const hex = (n) => '0x' + n.toString(16).toUpperCase().padStart(6, '0');

  // Faint xxd-style dump in the side gutters on wide screens, starting at the
  // offset the readout shows. Bytes are a hash of the address, so scrolling back
  // shows the same data. Signatures sit at made-up offsets, not the real layout.
  const gutters = ['left', 'right'].map((side) => {
    const pre = document.createElement('pre');
    pre.className = 'hexdump ' + side;
    pre.setAttribute('aria-hidden', 'true');
    document.body.prepend(pre);
    return pre;
  });
  const wide = window.matchMedia('(min-width: 1320px)');
  const SIGNATURES = [
    [0x27, 0x05, 0x19, 0x56],   // U-Boot uImage magic
    [0x5D, 0x00, 0x00, 0x80],   // LZMA header
    [0x68, 0x73, 0x71, 0x73]    // SquashFS "hsqs"
  ];
  function wordAt(a) {
    if (a >= 0x3E0000) return [0xFF, 0xFF, 0xFF, 0xFF];   // erased tail
    if (a % 0x40000 === 0) return SIGNATURES[(a / 0x40000) % SIGNATURES.length];
    let h = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B);
    h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
    return [h >>> 24, (h >>> 16) & 0xFF, (h >>> 8) & 0xFF, h & 0xFF];
  }
  const byte = (b) => b.toString(16).toUpperCase().padStart(2, '0');
  function renderDump(offset) {
    if (!wide.matches) return;
    const rows = Math.ceil(window.innerHeight / 16) + 1;
    let a = Math.min(offset, FLASH - rows * 4 * gutters.length);
    gutters.forEach((pre) => {
      const lines = [];
      for (let i = 0; i < rows; i++, a += 4) {
        lines.push(hex(a).slice(2) + '  ' + wordAt(a).map(byte).join(' '));
      }
      pre.textContent = lines.join('\n');
    });
  }

  const scrollFrac = (y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
  };
  // Round down to a 4 KiB sector, like a real reader reports progress.
  const offsetAt = (y) => Math.floor(scrollFrac(y) * FLASH / 0x1000) * 0x1000;

  // TOC as a flash memory map: each entry's offset is what the readout shows
  // after jumping to that section, so the two always agree.
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  tocLinks.forEach((a) => {
    const off = document.createElement('span');
    off.className = 'toc-off';
    const name = document.createElement('span');
    name.className = 'toc-name';
    name.textContent = a.getAttribute('href').slice(1);
    const title = document.createElement('span');
    title.className = 'toc-title';
    title.append(...a.childNodes);
    a.append(off, name, title);
  });
  function updateToc() {
    tocLinks.forEach((a) => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const y = target.getBoundingClientRect().top + window.scrollY - margin;
      a.querySelector('.toc-off').textContent = hex(offsetAt(y));
    });
  }

  let queued = false;
  function update() {
    queued = false;
    const frac = scrollFrac(window.scrollY);
    fill.style.width = (frac * 100) + '%';
    const offset = offsetAt(window.scrollY);
    addr.textContent = 'SPI READ ' + hex(offset) + ' / ' + hex(FLASH);
    bar.classList.toggle('active', window.scrollY > 40);
    renderDump(offset);
  }
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', () => { update(); updateToc(); });
  // Images change the page height as they load, which moves every offset.
  window.addEventListener('load', updateToc);
  update();
  updateToc();
})();

(function () {
  // Easter egg: the Konami code drops you into a (simulated) BusyBox root shell.
  // Deliberately spoiler-free: it teases the challenges without answering them.
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown',
                  'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let pos = 0;
  let shell = null;

  const BANNER = [
    '',
    'BusyBox (simulated) built-in shell (ash)',
    "Enter 'help' for a list of built-in commands.",
    '',
    'The real one is on the bench. Go get it over UART.',
    ''
  ];
  const COMMANDS = {
    help: () => 'Built-in commands:\n  help ls id whoami uname cat dmesg sudo clear reboot exit',
    ls: () => 'bin  dev  etc  lib  mnt  proc  sbin  sys  tmp  usr  var  web',
    id: () => 'uid=0(root) gid=0(root)',
    whoami: () => 'root',
    uname: (args) => args.includes('-a')
      ? 'Linux TL-WR841N 2.6.36 #1 Mon Jan 1 00:00:00 CST 2018 mips GNU/Linux'
      : 'Linux',
    cat: (args) => {
      const f = args[0];
      if (!f) return 'cat: missing operand';
      if (f === '/etc/passwd' || f === '/etc/shadow')
        return 'cat: ' + f + ': Nice try. Dump the flash and find it yourself.';
      if (f === '/proc/cpuinfo')
        return 'system type\t\t: MT7628\nmachine\t\t\t: TL-WR841N v14\ncpu model\t\t: MIPS 24KEc';
      if (f === '/proc/mtd')
        return 'dev:    size   erasesize  name\nmtd0: 00400000 00010000 "ALL"\n(the partition map is Section 3 homework)';
      return 'cat: can\'t open \'' + f + '\': No such file or directory';
    },
    dmesg: () => '[    0.000000] Linux version 2.6.36\n[    0.000000] SoC Type: MediaTek MT7628\n[    1.337000] serial8250: ttyS0 at MMIO 0x10000c00 is a 16550A\n[    1.337001] console [ttyS0] enabled, 115200n8',
    sudo: () => 'sudo: not found (you are already root, that is the whole point)',
    reboot: () => { setTimeout(close, 900); return 'The system is going down NOW!\nSent SIGTERM to all processes\nRequesting system reboot'; },
    exit: () => { close(); return ''; }
  };

  function print(text, cls) {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = text;
    shell.out.appendChild(line);
    shell.out.scrollTop = shell.out.scrollHeight;
  }

  function run(input) {
    print('/ # ' + input, 'sh-cmd');
    const [cmd, ...args] = input.trim().split(/\s+/);
    if (!cmd) return;
    if (cmd === 'clear') { shell.out.textContent = ''; return; }
    const fn = COMMANDS[cmd];
    const res = fn ? fn(args) : '-sh: ' + cmd + ': not found';
    if (res) print(res);
  }

  function open() {
    if (shell) return;
    const root = document.createElement('div');
    root.className = 'sh-overlay';
    root.innerHTML =
      '<div class="sh-term" role="dialog" aria-modal="true" aria-label="Simulated root shell">' +
        '<div class="sh-bar"><span>ttyS0 · 115200 8N1</span><button type="button" class="sh-close" aria-label="Close shell">×</button></div>' +
        '<div class="sh-out"></div>' +
        '<form class="sh-line"><span>/ #</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Shell command"></form>' +
      '</div>';
    document.body.appendChild(root);
    shell = {
      root,
      out: root.querySelector('.sh-out'),
      input: root.querySelector('input'),
      returnFocus: document.activeElement
    };
    BANNER.forEach((l) => print(l));
    root.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = shell.input.value;
      shell.input.value = '';
      run(v);
    });
    root.querySelector('.sh-close').addEventListener('click', close);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    shell.input.focus();
  }

  function close() {
    if (!shell) return;
    const { root, returnFocus } = shell;
    shell = null;
    root.remove();
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  document.addEventListener('keydown', (e) => {
    if (shell) {
      if (e.key === 'Escape') close();
      return;
    }
    const k = (e.key || '').toLowerCase();
    pos = k === KONAMI[pos] ? pos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (pos === KONAMI.length) { pos = 0; open(); }
  });

  // A hello for the people who open devtools (they are our target audience).
  try {
    console.log(
      '%c\n  U-Boot 1.1.3 (simulated)\n  Hit any key to stop autoboot:  0\n\n  ↑ ↑ ↓ ↓ ← → ← → B A  for a root shell\n',
      'font-family: monospace; color: #96aff5; background: #050520; padding: 4px 8px;'
    );
  } catch (e) {}
})();

(function () {
  // Quotes "arrive" over UART: typed in once when scrolled into view. Untyped
  // text stays in the DOM as transparent ghost text, so the layout never shifts
  // and screen readers get the whole quote.
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quotes = document.querySelectorAll('.quote blockquote p');
  if (prefersReduced || !quotes.length || !('IntersectionObserver' in window)) return;

  function prepare(p) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const parts = [];
    while (walker.nextNode()) parts.push(walker.currentNode);
    return parts.map((node) => {
      const text = node.nodeValue;
      const ghost = document.createElement('span');
      ghost.className = 'ghost';
      ghost.textContent = text;
      node.nodeValue = '';
      node.after(ghost);
      return { node, ghost, text };
    });
  }

  function type(p, parts) {
    const cursor = document.createElement('span');
    cursor.className = 'rx-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    const total = parts.reduce((n, t) => n + t.text.length, 0);
    const duration = Math.min(2600, total * 7);
    const start = performance.now();
    function frame(now) {
      let left = Math.floor(Math.min(1, (now - start) / duration) * total);
      let typing = false;
      for (const t of parts) {
        const n = Math.min(left, t.text.length);
        t.node.nodeValue = t.text.slice(0, n);
        t.ghost.textContent = t.text.slice(n);
        left -= n;
        // Cursor sits right after the last typed character.
        if (!typing && n < t.text.length) { t.node.after(cursor); typing = true; }
      }
      if (typing) requestAnimationFrame(frame);
      else p.appendChild(cursor);   // done: cursor keeps blinking at the end
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      type(e.target, e.target._rx);
    });
  }, { threshold: 0.4 });
  quotes.forEach((p) => { p._rx = prepare(p); io.observe(p); });
})();

(function () {
  // Drafting-style dimension lines on photos, labelled with the image's real
  // pixel size. The image is wrapped so the lines line up with it, not with
  // the figure's padding or caption. Shown on hover via CSS.
  document.querySelectorAll('.gallery figure img, .photo img').forEach((img) => {
    const frame = document.createElement('span');
    frame.className = 'fig-img';
    img.before(frame);
    frame.appendChild(img);

    const dim = (axis) => {
      const el = document.createElement('span');
      el.className = 'dim dim-' + axis;
      el.setAttribute('aria-hidden', 'true');
      el.appendChild(document.createElement('span'));
      frame.appendChild(el);
      return el.firstChild;
    };
    const w = dim('x'), h = dim('y');
    const label = () => {
      w.textContent = img.naturalWidth + ' PX';
      h.textContent = img.naturalHeight + ' PX';
    };
    if (img.complete && img.naturalWidth) label();
    else img.addEventListener('load', label, { once: true });
  });
})();

(function () {
  // Footer status line, like a serial console: TX blinks when you type or
  // click, RX blinks while data "arrives" (scrolling), plus uptime since the
  // page opened. Decorative, so hidden from assistive tech.
  const subRow = document.querySelector('footer .footer-sub');
  if (!subRow) return;

  const row = document.createElement('div');
  row.className = 'row footer-status';
  row.setAttribute('aria-hidden', 'true');
  row.innerHTML =
    '<span class="leds"><span class="led tx"></span>TX <span class="led rx"></span>RX' +
    '<span class="port">ttyS0 · 115200 8N1</span></span>' +
    '<span class="uptime">up 00:00:00</span>';
  subRow.before(row);

  const uptime = row.querySelector('.uptime');
  const start = Date.now();
  const pad = (n) => String(n).padStart(2, '0');
  setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000);
    uptime.textContent = 'up ' + pad(Math.floor(s / 3600)) + ':' +
      pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }, 1000);

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  function blinker(led) {
    let timer = 0;
    return () => {
      led.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => led.classList.remove('on'), 90);
    };
  }
  const tx = blinker(row.querySelector('.tx'));
  const rx = blinker(row.querySelector('.rx'));
  document.addEventListener('keydown', tx, { passive: true });
  document.addEventListener('click', tx, { passive: true });
  window.addEventListener('scroll', rx, { passive: true });
})();
