/* ============================================================
   APERTURE ASSETS — interactions
   Vanilla JS · no dependencies · respects prefers-reduced-motion
   ============================================================ */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* JS is active → allow reveal elements to start hidden (no-JS shows everything) */
  document.documentElement.classList.add('js');

  /* ---- Header scroll state ---- */
  const header = $('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  const burger = $('.burger');
  const menu   = $('.mobile-menu');
  if (burger && menu) {
    const toggle = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', () => toggle(!document.body.classList.contains('menu-open')));
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---- Reveal on scroll (scroll + rAF; robust across browsers/preview) ---- */
  const revealEls = $$('[data-reveal], [data-reveal-img]');
  // stagger index for grouped children
  $$('.stagger').forEach(group =>
    $$(':scope > *', group).forEach((child, i) => child.style.setProperty('--i', i))
  );
  if (reduce) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    let pending = [...revealEls];
    let ticking = false;
    const reveal = () => {
      const vh = window.innerHeight;
      pending = pending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { el.classList.add('in'); return false; }
        return true;
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(reveal); ticking = true; } };
    reveal();                                   // reveal whatever is in view at load
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('load', reveal);    // catch late layout shifts (fonts/images)
    // absolute failsafe — never leave content hidden
    setTimeout(() => revealEls.forEach(el => el.classList.add('in')), 4000);
  }

  /* ---- Typewriter on scroll (antigravity-style "typed" reveal) ----
     Eyebrows + headings (slow, deliberate) AND body copy (a quicker stream) type
     out character-by-character as they scroll into view, with a caret riding the
     typing position. The home hero keeps a permanent blinking caret after its last
     character. Full text stays available to assistive tech via an off-screen
     .sr-only copy (works on <p> too), and the animated per-char spans are
     aria-hidden. Elements are split up-front so they start blank (no flash) and
     hold their layout. Reduced-motion shows everything at once, with a static
     (non-blinking) caret on the hero. */
  const heroTitle = $('.hero--full .display');
  if (reduce) {
    if (heroTitle) {
      const c = document.createElement('span');
      c.className = 'tw-caret';                          // ink caret, matches the type
      c.setAttribute('aria-hidden', 'true');
      heroTitle.appendChild(c);
    }
  } else {
    const clamp = (min, max, v) => Math.max(min, Math.min(max, Math.round(v)));
    const splitForType = (el) => {
      const wrap = document.createElement('span');
      wrap.className = 'tw';
      wrap.setAttribute('aria-hidden', 'true');
      const chars = [];
      let label = '';
      const walk = (src, dest) => {
        src.childNodes.forEach(n => {
          if (n.nodeType === 3) {                        // text node → per-char spans
            for (const ch of n.textContent) {
              const s = document.createElement('span');
              s.className = 'tw-char';
              s.textContent = ch;
              dest.appendChild(s);
              chars.push(s);
              label += ch;
            }
          } else if (n.nodeName === 'BR') {              // preserve line breaks
            dest.appendChild(document.createElement('br'));
            label += ' ';
          } else {                                       // preserve nested elements
            const clone = n.cloneNode(false);
            dest.appendChild(clone);
            walk(n, clone);
          }
        });
      };
      walk(el, wrap);
      el.textContent = '';
      const sr = document.createElement('span');         // full text for screen readers
      sr.className = 'sr-only';
      sr.textContent = label.replace(/\s+/g, ' ').trim();
      el.appendChild(sr);
      el.appendChild(wrap);
      return chars;
    };

    // Split every target up-front (blank until typed → no flash, stable layout).
    const typeMeta = new Map();
    let pendingType = $$('.kicker, .display, h2, h3, main p').filter(el => el.textContent.trim());
    pendingType.forEach(el => { el.classList.add('tw-el'); typeMeta.set(el, splitForType(el)); });

    const typeEl = (el) => {
      if (el.dataset.twDone) return;
      el.dataset.twDone = '1';
      const chars = typeMeta.get(el);
      if (!chars || !chars.length) return;
      const wrap = el.querySelector('.tw');
      const persist = el === heroTitle;
      const caret = document.createElement('span');
      caret.className = 'tw-caret';                       // ink caret (same colour as the text)
      caret.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(caret, wrap.firstChild);
      const headingLike = el.matches('.kicker, .display, h2, h3');
      const total = chars.length;
      // ~2/3 of the previous pace (≈1.5× the per-char delay) — a slower, more
      // deliberate read that invites the visitor to take the page in.
      const per = headingLike ? clamp(45, 123, 3150 / total)   // headings: slow & deliberate
                              : clamp(11, 36, 3300 / total);   // body: measured stream, ~3s cap
      let i = 0;
      const step = () => {
        if (i < total) {
          chars[i].classList.add('on');
          chars[i].after(caret);                         // caret rides the last typed char
          i += 1;
          setTimeout(step, per);
        } else if (persist) {
          caret.classList.add('blink');                  // hero: blink forever
        } else {
          caret.classList.add('blink');
          setTimeout(() => caret.remove(), 1200);        // others: blink briefly, then clear
        }
      };
      step();
    };

    // Trigger on scroll, throttled by timestamp (deliberately NOT via
    // requestAnimationFrame or IntersectionObserver — both can stall when the tab
    // is backgrounded, which would leave content un-typed).
    const runType = () => {
      const vh = window.innerHeight;
      pendingType = pendingType.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { typeEl(el); return false; }
        return true;
      });
    };
    let lastTypeRun = 0;
    const onTypeScroll = () => {
      const now = Date.now();
      if (now - lastTypeRun >= 60) { lastTypeRun = now; runType(); }
    };
    runType();                                            // type whatever is in view now
    window.addEventListener('scroll', onTypeScroll, { passive: true });
    window.addEventListener('resize', onTypeScroll, { passive: true });
    window.addEventListener('load', runType);
  }

  /* ---- Rolling tile titles on hover (lusion-style vertical roll) ----
     The visible title rolls up and out while an identical copy rolls in from
     below. The copy is aria-hidden so screen readers still read one title. */
  if (!reduce) {
    $$('.dest-card__name').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      el.textContent = '';
      el.classList.add('roll');
      const a = document.createElement('span'); a.className = 'roll__line roll__line--a'; a.textContent = text;
      const b = document.createElement('span'); b.className = 'roll__line roll__line--b'; b.textContent = text;
      b.setAttribute('aria-hidden', 'true');
      el.append(a, b);
    });
  }

  /* ---- Tile image parallax (lusion-style drift within the frame on scroll) ----
     Wrap each featured-tile image in a slightly-oversized inner element and slide
     it against the scroll, so the photo drifts inside its rounded mask. Kept off
     the image's own transform so the hover zoom stays independent. */
  if (!reduce) {
    const parTiles = [];
    $$('.dest-card .media').forEach(media => {
      const img = media.querySelector('img');
      if (!img) return;
      const inner = document.createElement('div');
      inner.className = 'media__inner';
      media.insertBefore(inner, img);
      inner.appendChild(img);
      parTiles.push({ media, inner });
    });
    if (parTiles.length) {
      const updatePar = () => {
        const vh = window.innerHeight;
        for (const t of parTiles) {
          const r = t.media.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) continue;
          const p = (r.top + r.height / 2) / vh - 0.5;   // -0.5 (top) … +0.5 (bottom)
          t.inner.style.setProperty('--py', (p * -24).toFixed(1) + 'px');
        }
      };
      let lastPar = 0;
      const onParScroll = () => { const n = Date.now(); if (n - lastPar >= 16) { lastPar = n; updatePar(); } };
      updatePar();
      window.addEventListener('scroll', onParScroll, { passive: true });
      window.addEventListener('resize', onParScroll, { passive: true });
    }
  }

  /* ---- 3D pointer tilt on tiles (lusion-style featured-work effect) ----
     The whole tile rotates in 3D toward the cursor and lifts — perspective +
     rotateX/rotateY + lift + scale composited into one inline transform. A quick
     transition tracks the pointer; on leave the tile eases home via the card's own
     spring transition. Desktop pointer only; skipped under reduced motion. */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    const MAX = 12;                                       // max tilt in degrees
    $$('.dest-card, .photo-tile').forEach(tile => {
      const isCard = tile.classList.contains('dest-card');
      const lift = isCard ? -12 : -10;
      const scale = isCard ? 1.028 : 1.025;
      const frame = tile.querySelector('.media') || tile;
      tile.addEventListener('mouseenter', () => { tile.style.transition = 'transform .14s ease-out'; });
      tile.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 2 - 1;   // -1 … 1
        const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) * 2 - 1;
        tile.style.transform =
          `perspective(1000px) rotateX(${(-ny * MAX).toFixed(2)}deg) rotateY(${(nx * MAX).toFixed(2)}deg) ` +
          `translateY(${lift}px) scale(${scale})`;
      });
      tile.addEventListener('mouseleave', () => {
        tile.style.transition = '';                       // revert to the CSS spring → soft settle
        tile.style.transform = '';
      });
    });
  }

  /* ---- Idle 3D drift + gyroscope tilt on tiles ----
     Every tile frame gently drifts in 3D on its own (a slow "hint of 3D" even when
     nothing is touched), and on touch devices the phone's orientation is ADDED to
     that drift so tiles tilt as it moves. Both feed per-tile --gx/--gy that the
     .tilt-live CSS turns into a perspective rotation; the total is clamped to 12°,
     matching the desktop pointer tilt. iOS 13+ needs a permission tap for the gyro
     part (small button); Android / older iOS start at once; the drift itself needs
     no permission. Gyro needs a secure context (https / localhost). Driven by
     setInterval (not rAF) so it keeps ticking when the tab is merely backgrounded,
     and it pauses when the tab is actually hidden. */
  if (!reduce) {
    const tiles = $$('.dest-card .media, .photo-tile .media').map(m => ({ m, ph: Math.random() * 6.283 }));
    if (tiles.length) {
      const DRIFT = 2.4, CLAMP = 12;
      const clampT = v => Math.max(-CLAMP, Math.min(CLAMP, v));
      let gyroX = 0, gyroY = 0;

      // Gyroscope (touch only) adds device orientation on top of the drift.
      if (window.matchMedia('(hover:none)').matches && 'DeviceOrientationEvent' in window) {
        const GAIN = 0.7;
        let baseB = null, baseG = null, cx = 0, cy = 0;
        const onOrient = (e) => {
          if (e.beta == null || e.gamma == null) return;
          if (baseB === null) { baseB = e.beta; baseG = e.gamma; }   // neutral = first hold
          cx += (((e.beta  - baseB) * GAIN) - cx) * 0.2;             // smoothed
          cy += (((e.gamma - baseG) * GAIN) - cy) * 0.2;
          gyroX = cx; gyroY = cy;
        };
        const startGyro = () => window.addEventListener('deviceorientation', onOrient, { passive: true });
        if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
          startGyro();                                            // Android / older iOS
        } else {
          const btn = document.createElement('button');           // iOS 13+: needs a user gesture
          btn.type = 'button';
          btn.className = 'motion-btn';
          btn.textContent = 'Enable 3D tilt';
          document.body.appendChild(btn);
          setTimeout(() => btn.classList.add('show'), 40);
          const dismiss = () => { btn.classList.remove('show'); setTimeout(() => btn.remove(), 500); };
          btn.addEventListener('click', async () => {
            try { if (await DeviceOrientationEvent.requestPermission() === 'granted') startGyro(); }
            catch (_) { /* denied/unsupported — drift + scroll-magnify remain */ }
            dismiss();
          });
          setTimeout(dismiss, 9000);                              // auto-hide if ignored
        }
      }

      // Drift + compose loop: only touches on-screen tiles; pauses when tab hidden.
      document.documentElement.classList.add('tilt-live');
      let timer = null;
      const tick = () => {
        const vh = window.innerHeight, now = Date.now() * 0.001;
        for (const t of tiles) {
          const r = t.m.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          const dx = Math.sin(now * 0.6 + t.ph) * DRIFT;          // slow, phase-offset per tile
          const dy = Math.cos(now * 0.45 + t.ph * 1.3) * DRIFT;
          t.m.style.setProperty('--gx', clampT(dx + gyroX).toFixed(2) + 'deg');
          t.m.style.setProperty('--gy', clampT(dy + gyroY).toFixed(2) + 'deg');
        }
      };
      const start = () => { if (!timer) { tick(); timer = setInterval(tick, 33); } };  // ~30fps
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      start();
      document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
    }
  }

  /* ---- Portfolio filters ---- */
  const chips = $$('.chip');
  const items = $$('[data-cat]');
  if (chips.length && items.length) {
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      const f = chip.dataset.filter;
      items.forEach(it => {
        const show = f === 'all' || it.dataset.cat.split(' ').includes(f);
        it.style.display = show ? '' : 'none';
      });
    }));
  }

  /* ---- Lightbox (portfolio + destination galleries) ---- */
  const lb = $('.lightbox');
  const triggers = $$('.lb-item');
  if (lb && triggers.length) {
    const lbImg = $('.lightbox img', lb);
    const lbCap = $('.lightbox__cap', lb);
    let list = [];      // currently-visible items
    let index = 0;

    const visibleItems = () => triggers.filter(t => t.offsetParent !== null);
    const dataFor = (el) => {
      const img = $('img', el);
      return {
        src: img.getAttribute('src'),
        cap: (el.dataset.caption || (($('figcaption', el) || {}).textContent) || img.alt || '').trim()
      };
    };
    const show = (i) => {
      index = (i + list.length) % list.length;
      const d = dataFor(list[index]);
      lbImg.src = d.src; lbImg.alt = d.cap; lbCap.textContent = d.cap;
    };
    const open = (el) => {
      list = visibleItems();
      show(list.indexOf(el));
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };

    triggers.forEach(el => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', (e) => { e.preventDefault(); open(el); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
    });
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lightbox__nav--prev', lb).addEventListener('click', () => show(index - 1));
    $('.lightbox__nav--next', lb).addEventListener('click', () => show(index + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
  }

  /* ---- Scroll-driven zoom + fade to white: home hero + destination hero ---- */
  // Each entry pairs a host section with its inner image wrapper. Both read --p
  // from the wrapper (the CSS lives on `.hero__media img` / `.detail-hero .media img`).
  const scrollFaders = [
    [$('.hero--full'),  '.hero__media'],
    [$('.detail-hero'), '.media'],
  ]
    .map(([host, sel]) => (host ? [host, $(sel, host)] : null))
    .filter(pair => pair && pair[1]);
  if (scrollFaders.length && !reduce) {
    let ticking = false;
    const update = () => {
      scrollFaders.forEach(([host, media]) => {
        const h = host.offsetHeight || 1;
        const p = Math.max(0, Math.min(1, window.scrollY / h));
        media.style.setProperty('--p', p.toFixed(3));
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ---- Destination cards + photo tiles: scroll-triggered magnify on touch ---- */
  const focusTiles = $$('.dest-card, .photo-tile');
  if (focusTiles.length && 'IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('in-focus', e.isIntersecting)),
      { rootMargin: '-38% 0px -38% 0px', threshold: 0 }
    );
    focusTiles.forEach(c => io.observe(c));
  }

  /* ---- Floating particle field (antigravity motif) ----
     Cool grey-blue specks drifting slowly upward behind hero content. Each
     <canvas class="particles"> fills its positioned parent. Fully skipped under
     reduced-motion; pauses when scrolled out of view or the tab is hidden. */
  const particleCanvases = $$('canvas.particles');
  if (particleCanvases.length && !reduce && 'IntersectionObserver' in window) {
    particleCanvases.forEach(setupParticleField);
  }
  function setupParticleField(canvas) {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const base = getComputedStyle(document.documentElement)
      .getPropertyValue('--particle').trim() || '130,140,168';
    let w = 0, h = 0, dots = [], raf = 0, running = false, onScreen = false;

    const spawn = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(Math.random() * 0.16 + 0.03),
      a: Math.random() * 0.35 + 0.1,
      tw: Math.random() * Math.PI * 2,
      tws: Math.random() * 0.018 + 0.004,
      blue: Math.random() < 0.16
    });

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, Math.max(24, (w * h) / 15000)));
      dots = Array.from({ length: count }, spawn);
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of dots) {
        p.x += p.vx; p.y += p.vy; p.tw += p.tws;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        const a = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.blue ? 'rgba(26,115,232,' + (a * 0.85).toFixed(3) + ')'
                                : 'rgba(' + base + ',' + a.toFixed(3) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (running) return; running = true; frame(); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt); rt = setTimeout(resize, 150);
    }, { passive: true });
    resize();
    onScreen = true;
    if (!document.hidden) start();          // begin immediately; don't gate startup on IO
    if ('IntersectionObserver' in window) { // IO is only a pause optimisation when off-screen
      const io = new IntersectionObserver(entries => {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start(); else stop();
      }, { threshold: 0 });
      io.observe(host);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (onScreen) start();
    });
  }

  /* ---- Footer year ---- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
