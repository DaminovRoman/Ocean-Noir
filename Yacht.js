/* ==========================================================================
   OCEAN NOIR — Interaction Layer
   Vanilla JS. No dependencies.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /* ------------------------------------------------------------------
     1. SCROLL PROGRESS INDICATOR
     Trigger: window scroll
     Purpose: gives the visitor a persistent, quiet sense of "how much
     of the story is left" — a thin metal line rather than a percentage.
  ------------------------------------------------------------------ */
  const scrollBar = document.getElementById('scrollBar');
  function updateScrollProgress() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    if (scrollBar) scrollBar.style.width = pct + '%';
  }

  /* ------------------------------------------------------------------
     2. NAV — scrolled state + burger menu
  ------------------------------------------------------------------ */
  const nav = document.getElementById('siteNav');
  function updateNavState() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }

  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const DESKTOP_BREAKPOINT = 1000;

  function openMobileMenu() {
    if (!burgerBtn || !mobileMenu) return;
    mobileMenu.classList.add('is-open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    burgerBtn.setAttribute('aria-label', 'Закрыть меню');
    mobileMenu.setAttribute('aria-hidden', 'false');
    nav.classList.add('menu-open'); // gives the header a solid backdrop so the logo never blends into the menu below it
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!burgerBtn || !mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', 'true');
    nav.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  if (burgerBtn && mobileMenu) {
    burgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Escape closes the menu, same as tapping the burger again
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMobileMenu();
    });

    // If the viewport grows past the desktop breakpoint while the menu is
    // open (rotating a tablet, resizing a window), the burger and mobile
    // menu are hidden by CSS but would otherwise leave scroll locked with
    // no visible way to unlock it — so close it proactively.
    window.addEventListener('resize', () => {
      if (window.innerWidth > DESKTOP_BREAKPOINT && mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      }
    });
  }

  /* ------------------------------------------------------------------
     2b. CONSULTATION MODAL — every CTA that isn't in-page navigation
     opens a modal with a request form instead of a mailto link.
  ------------------------------------------------------------------ */
  const consultModal = document.getElementById('consultModal');
  const consultForm = document.getElementById('consultForm');
  let lastFocusedBeforeModal = null;

  function openConsultModal() {
    if (!consultModal) return;
    lastFocusedBeforeModal = document.activeElement;
    consultModal.classList.add('is-open');
    consultModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeMobileMenu();

    // reset to the form view every time it's opened
    const formView = consultModal.querySelector('[data-consult-view="form"]');
    const successView = consultModal.querySelector('[data-consult-view="success"]');
    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;
    if (consultForm) consultForm.reset();

    const firstField = consultModal.querySelector('#consultName');
    if (firstField) setTimeout(() => firstField.focus(), 300);
  }

  function closeConsultModal() {
    if (!consultModal) return;
    consultModal.classList.remove('is-open');
    consultModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    }
  }

  document.querySelectorAll('[data-action="consult"]').forEach(btn => {
    btn.addEventListener('click', openConsultModal);
  });

  if (consultModal) {
    consultModal.querySelectorAll('[data-consult-close]').forEach(el => {
      el.addEventListener('click', closeConsultModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && consultModal.classList.contains('is-open')) closeConsultModal();
    });
  }

  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!consultForm.checkValidity()) {
        consultForm.reportValidity();
        return;
      }

      // Static page, no backend: swap to a confirmation view.
      // To wire this to a real inbox, replace this block with a fetch()
      // call to your form endpoint (e.g. Formspree, a serverless function).
      const formView = consultModal.querySelector('[data-consult-view="form"]');
      const successView = consultModal.querySelector('[data-consult-view="success"]');
      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;
    });
  }

  document.querySelectorAll('[data-action="scroll"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSel = btn.dataset.target;
      const target = targetSel && document.querySelector(targetSel);
      if (!target) return;
      const navH = nav?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navH + 1;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* Combined scroll handler (rAF-throttled) */
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateNavState();
        updateFilmProgress();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollProgress();
  updateNavState();

  /* ------------------------------------------------------------------
     3. PREMIUM CURSOR — glow + dot
     Trigger: mousemove (desktop / fine pointer only)
     Duration: continuous, dot has 0.15s lag easing for a "liquid" feel
     Purpose: reinforces the "liquid metal" concept requested in the brief
     and gives hover states a tactile, expensive feel instead of a
     default browser pointer.
  ------------------------------------------------------------------ */
  if (!isCoarsePointer) {
    const glow = document.getElementById('cursorGlow');
    const dot = document.getElementById('cursorDot');
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (glow) {
        glow.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
      }
      if (dot) {
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
      }
    }, { passive: true });

    const hoverTargets = 'a, button, .film__slide, .catalog__row, .port';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets) && dot) dot.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets) && dot) dot.classList.remove('is-hover');
    });
  }

  /* ------------------------------------------------------------------
     4. MAGNETIC BUTTONS
     Trigger: mousemove within a bounded radius around the button
     Duration: 0.25s ease-out on move, snaps back over the same duration
     Purpose: buttons feel physically responsive, like a well-damped
     mechanical control rather than a flat web element.
  ------------------------------------------------------------------ */
  if (!isCoarsePointer && !prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = 0.35;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ------------------------------------------------------------------
     5. SCROLL REVEAL (Luxury Fade) + SPLIT TEXT REVEAL
     Trigger: IntersectionObserver, element 15% visible
     Duration: 1s / Delay: staggered via CSS transition-delay on groups
     Easing: cubic-bezier(0.16,1,0.3,1) — a slow-settle "luxury" ease
     Purpose: content arrives with weight and confidence rather than
     snapping in; mirrors how light settles on water rather than flashing.
  ------------------------------------------------------------------ */
  function prepareSplitText() {
    document.querySelectorAll('[data-split]').forEach(el => {
      const text = el.textContent;
      el.innerHTML = `<span class="split-line"><span>${text}</span></span>`;
    });
  }
  prepareSplitText();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal], [data-split]').forEach(el => revealObserver.observe(el));

  /* ------------------------------------------------------------------
     6. COUNT-UP STATS
     Trigger: IntersectionObserver on .philosophy__stats
     Duration: 1.6s per counter, eased (ease-out cubic)
     Purpose: the philosophy section's numbers (years, deals, ports)
     should feel like they're being tallied in front of the visitor —
     reinforcing the "track record" narrative at the exact moment of trust-building.
  ------------------------------------------------------------------ */
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat__num').forEach(el => statObserver.observe(el));

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReducedMotion) { el.textContent = target; return; }
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     7. FILM STRIP PROGRESS BAR
     Trigger: scroll (horizontal) on #filmTrack
     Purpose: thin progress line under the yacht reel — a wayfinding cue
     that also visually echoes the scroll-progress bar's material.
  ------------------------------------------------------------------ */
  const filmTrack = document.getElementById('filmTrack');
  const filmProgress = document.getElementById('filmProgress');
  function updateFilmProgress() {
    if (!filmTrack || !filmProgress) return;
    const max = filmTrack.scrollWidth - filmTrack.clientWidth;
    const pct = max > 0 ? (filmTrack.scrollLeft / max) * 100 : 0;
    filmProgress.style.width = Math.max(pct, 4) + '%';
  }
  if (filmTrack) {
    filmTrack.addEventListener('scroll', () => {
      requestAnimationFrame(updateFilmProgress);
    }, { passive: true });
    updateFilmProgress();
  }

  /* ------------------------------------------------------------------
     8. CATALOG FILTERS
     Trigger: click on .filter-chip
     Purpose: instant, non-blocking filtering of the manifest list —
     no page reload, no loading spinner (a spinner would feel cheap
     against this brand).
  ------------------------------------------------------------------ */
  const filterChips = document.querySelectorAll('.filter-chip');
  const catalogRows = document.querySelectorAll('.catalog__row');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const filter = chip.dataset.filter;
      catalogRows.forEach(row => {
        const cats = row.dataset.category || '';
        const match = filter === 'all' || cats.split(' ').includes(filter);
        row.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ------------------------------------------------------------------
     9. WORLD MAP — route draw-in + port glow
     Trigger: IntersectionObserver on #map section
     Duration: 2.4s per route (staggered 150ms apart), ease-luxury
     Purpose: routes should feel like they're being charted live —
     reinforcing "a live global network" rather than a static graphic.
  ------------------------------------------------------------------ */
  const mapSection = document.getElementById('map');
  const routes = document.querySelectorAll('.route');
  if (mapSection && routes.length) {
    const mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          routes.forEach((route, i) => {
            setTimeout(() => route.classList.add('is-drawn'), i * 180);
          });
          mapObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    mapObserver.observe(mapSection);
  }

  /* Port tooltip accessibility: focusable via tabindex, shows label on focus too */
  document.querySelectorAll('.port').forEach(port => {
    port.setAttribute('tabindex', '0');
    port.setAttribute('role', 'img');
    const label = port.dataset.port;
    if (label) port.setAttribute('aria-label', label);
  });

  /* ------------------------------------------------------------------
     10. VOICES — testimonial dots + scroll sync
     Trigger: scroll on #voicesTrack (horizontal snap)
     Purpose: quiet pagination for the magazine-style testimonial spread.
  ------------------------------------------------------------------ */
  const voicesTrack = document.getElementById('voicesTrack');
  const voicesDots = document.getElementById('voicesDots');
  if (voicesTrack && voicesDots) {
    const voiceCount = voicesTrack.children.length;
    for (let i = 0; i < voiceCount; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Отзыв ${i + 1} из ${voiceCount}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => {
        const slide = voicesTrack.children[i];
        voicesTrack.scrollTo({ left: slide.offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
      voicesDots.appendChild(dot);
    }
    const dotEls = voicesDots.querySelectorAll('button');
    voicesTrack.addEventListener('scroll', () => {
      const index = Math.round(voicesTrack.scrollLeft / voicesTrack.clientWidth);
      dotEls.forEach((d, i) => d.classList.toggle('is-active', i === index));
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     11. OCEAN PARALLAX
     Trigger: scroll, applied to [data-parallax] images
     Purpose: large lifestyle/philosophy imagery drifts slightly slower
     than scroll speed, giving a sense of depth — like looking past
     glass into deep water rather than at a flat photo.
  ------------------------------------------------------------------ */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !prefersReducedMotion) {
    let parallaxTicking = false;
    function updateParallax() {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = (rect.top - vh) / (vh + rect.height);
        const shift = progress * 40;
        const img = el.querySelector('img');
        if (img) img.style.transform = `translateY(${shift}px) scale(1.12)`;
      });
      parallaxTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ------------------------------------------------------------------
     12. HERO OCEAN CANVAS — "Ocean Noir" water simulation
     Trigger: continuous requestAnimationFrame loop while hero is visible
     Purpose: replaces a heavy hero video with a lightweight, infinitely
     looping dark-water simulation — layered sine-wave "swells" with a
     soft moonlight specular highlight that drifts toward the cursor
     (mouse-glow), directly realizing the brief's "лунный свет на воде"
     concept without a video asset dependency.
     Performance: pauses via IntersectionObserver when hero scrolls out
     of view, and reduces to a static single frame under prefers-reduced-motion.
  ------------------------------------------------------------------ */
  const canvas = document.getElementById('oceanCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    let w, h, dpr;
    let rafId = null;
    let heroVisible = true;
    let pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };
    let t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    });

    /* Layered sine swells simulate moonlit water without WebGL cost */
    function drawFrame() {
      pointer.x += (pointer.tx - pointer.x) * 0.02;
      pointer.y += (pointer.ty - pointer.y) * 0.02;

      // base graphite -> indigo vertical gradient (the "dark mirror ocean")
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0A0B0E');
      bg.addColorStop(0.55, '#0D0F14');
      bg.addColorStop(1, '#14161D');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // moonlight specular column, follows pointer horizontally
      const glowX = pointer.x * w;
      const glowY = h * 0.28 + pointer.y * h * 0.15;
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, w * 0.35);
      glow.addColorStop(0, 'rgba(232,179,112,0.10)');
      glow.addColorStop(0.4, 'rgba(201,168,118,0.045)');
      glow.addColorStop(1, 'rgba(201,168,118,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // layered horizontal swell lines — three depths, slow drift
      const layers = [
        { y: h * 0.55, amp: h * 0.012, freq: 0.006, speed: 0.15, alpha: 0.10, width: 1 },
        { y: h * 0.68, amp: h * 0.018, freq: 0.004, speed: 0.09, alpha: 0.14, width: 1.2 },
        { y: h * 0.82, amp: h * 0.026, freq: 0.003, speed: 0.05, alpha: 0.18, width: 1.4 }
      ];

      layers.forEach((layer, li) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const distToGlow = 1 - Math.min(Math.abs(x - glowX) / (w * 0.4), 1);
          const y = layer.y
            + Math.sin(x * layer.freq + t * layer.speed + li) * layer.amp
            + Math.sin(x * layer.freq * 2.3 - t * layer.speed * 1.4) * layer.amp * 0.35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          if (distToGlow > 0.15 && x % 24 < 6) {
            ctx.save();
            ctx.strokeStyle = `rgba(232,179,112,${(layer.alpha + distToGlow * 0.4).toFixed(3)})`;
            ctx.lineWidth = layer.width;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 14, y - 1.5);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.strokeStyle = `rgba(154,160,172,${layer.alpha})`;
        ctx.lineWidth = layer.width;
        ctx.stroke();
      });

      // subtle top vignette so nav stays legible
      const topFade = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      topFade.addColorStop(0, 'rgba(10,11,14,0.5)');
      topFade.addColorStop(1, 'rgba(10,11,14,0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, w, h * 0.25);

      t += 1;
    }

    function loop() {
      if (!heroVisible) return;
      drawFrame();
      rafId = requestAnimationFrame(loop);
    }

    if (prefersReducedMotion) {
      drawFrame(); // single static frame, no animation loop
    } else {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          heroVisible = entry.isIntersecting;
          if (heroVisible && !rafId) loop();
          if (!heroVisible && rafId) { cancelAnimationFrame(rafId); rafId = null; }
        });
      }, { threshold: 0 });
      const heroEl = document.getElementById('hero');
      if (heroEl) heroObserver.observe(heroEl);
      loop();
    }
  }

  /* ------------------------------------------------------------------
     13. SMOOTH ANCHOR SCROLL WITH NAV OFFSET
     Trigger: click on in-page anchor links
     Purpose: native smooth-scroll doesn't account for the fixed nav
     height, which would otherwise clip section headings on arrival.
  ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('siteNav')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navH + 1;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

})();
