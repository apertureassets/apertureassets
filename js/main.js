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
    const setHeaderHeight = () => document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    setHeaderHeight();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setHeaderHeight, { passive: true });
    // header padding animates on the scrolled-state toggle, which changes its height
    header.addEventListener('transitionend', setHeaderHeight);
  }

  /* ---- Sticky sub-nav (destination pages: jump-to-city bar) ---- */
  const subnav = $('.subnav');
  if (subnav) {
    const subnavLinks = $$('.subnav__link', subnav);
    const citySections = $$('section[data-city]');
    const setStickyOffset = () => {
      const offset = (header ? header.offsetHeight : 0) + subnav.offsetHeight;
      document.documentElement.style.setProperty('--sticky-offset', offset + 'px');
    };
    setStickyOffset();
    window.addEventListener('resize', setStickyOffset, { passive: true });
    window.addEventListener('load', setStickyOffset);

    const setActiveCity = (city) => {
      subnavLinks.forEach(l => l.classList.toggle('is-active', l.dataset.city === city));
      // Keep the active tab in view as the page scrolls — without this, a tab
      // further along the bar than fits on screen (especially on mobile,
      // where only 2-3 tabs are visible at once) goes active off-screen with
      // no visible indication of where you are.
      const activeLink = subnavLinks.find(l => l.dataset.city === city);
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      }
    };
    if (citySections.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) setActiveCity(entry.target.dataset.city); });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      citySections.forEach(s => io.observe(s));
    }
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

  /* ---- Reveal on scroll (scroll + rAF; robust across browsers/preview) ----
     Photo tiles / destination cards / photo-strips are split out below —
     they get a continuous scroll-scrubbed fade instead of this threshold-
     triggered one-shot fade. Everything else (headings, body copy, the
     hero's [data-reveal-img]) keeps this original behaviour. */
  const allRevealEls = $$('[data-reveal], [data-reveal-img]');
  const mediaRevealEls = allRevealEls.filter(el => el.matches('.photo-tile, .dest-card, .photo-strip'));
  const textRevealEls = allRevealEls.filter(el => !mediaRevealEls.includes(el));
  // stagger index for grouped children
  $$('.stagger').forEach(group =>
    $$(':scope > *', group).forEach((child, i) => child.style.setProperty('--i', i))
  );
  if (reduce) {
    textRevealEls.forEach(el => el.classList.add('in'));
  } else {
    let pending = [...textRevealEls];
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
    setTimeout(() => textRevealEls.forEach(el => el.classList.add('in')), 4000);
  }

  /* ---- Photo tile / destination-card entrance: scroll-scrubbed colour ----
     Drives the desaturate-to-colour bloom on .media img (see style.css) —
     continuously tied to scroll position rather than a one-shot trigger,
     the same --p-style mechanism as the hero's scroll-driven zoom/fade
     below. --rp is set on each tile root and reaches its inner .media img
     via CSS custom-property inheritance. Tracks scroll both directions —
     scroll back up past a tile and it desaturates again, same as the hero's
     --p — so it's a pure function of position, not a one-shot latch. */
  if (mediaRevealEls.length) {
    if (reduce) {
      mediaRevealEls.forEach(el => el.style.setProperty('--rp', '1'));
    } else {
      let ticking = false;
      const update = () => {
        const vh = window.innerHeight;
        const bandTop = vh * 0.92;    // --rp 0 when a tile's top is here
        const bandBottom = vh * 0.55; // --rp 1 when a tile's top reaches here
        mediaRevealEls.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return; // skip far offscreen
          const raw = (bandTop - r.top) / (bandTop - bandBottom);
          const rp = Math.max(0, Math.min(1, raw));
          el.style.setProperty('--rp', rp.toFixed(3));
        });
        ticking = false;
      };
      const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('load', update);
      // No timed failsafe here (unlike the text reveal above): update() is
      // geometry-driven and re-runs on every scroll/resize/load, so a tile
      // is always correctly revealed once actually scrolled near — nothing
      // to fail. A timed "reveal everything" would defeat the whole point
      // of a scroll-scrubbed entrance for any tile not yet scrolled to.
    }
  }

  /* ---- Typewriter on scroll (antigravity-style "typed" reveal) ----
     Eyebrows + headings type out character-by-character as they scroll into
     view, with a caret riding the typing position. Body copy is left static
     (testers found the typed body text gimmicky). The home hero keeps a
     permanent blinking caret after its last character. Full text stays
     available to assistive tech via an off-screen .sr-only copy, and the
     animated per-char spans are aria-hidden. Elements are split up-front so
     they start blank (no flash) and hold their layout. Reduced-motion shows
     everything at once, with a static (non-blinking) caret on the hero. */
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
    // Destination essays and the camera bag page carry many stacked H2/H3s
    // (e.g. one per itinerary city) — typing each one individually reads as
    // glitchy on a fast scroll, so those pages restrict the effect to the
    // page's own H1/.display title via the "type-h1-only" body class.
    const typeSelector = document.body.classList.contains('type-h1-only') ? '.display' : '.kicker, .display, h2, h3';
    const typeMeta = new Map();
    let pendingType = $$(typeSelector).filter(el => el.textContent.trim());
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
      const total = chars.length;
      const per = clamp(45, 123, 3150 / total);            // slow & deliberate
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
          t.inner.style.setProperty('--py', Math.min(0, p * -24).toFixed(1) + 'px');
        }
      };
      let lastPar = 0;
      const onParScroll = () => { const n = Date.now(); if (n - lastPar >= 16) { lastPar = n; updatePar(); } };
      updatePar();
      window.addEventListener('scroll', onParScroll, { passive: true });
      window.addEventListener('resize', onParScroll, { passive: true });
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
