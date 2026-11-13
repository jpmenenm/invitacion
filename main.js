/* =========================================================
   Invitación · Darío & Josefa
   Orden de arranque (ver README al final del chat):
   1) Lenis (y se detiene mientras está la pantalla de entrada)
   2) GSAP + ScrollTrigger enlazados al ticker de Lenis
   3) Flores SVG, textos, reveals
   4) Magnific Popup (pausa/reanuda Lenis al abrir/cerrar)
   5) YouTube IFrame API (se inicia con el clic en "Abrir")
   ========================================================= */
(function () {
  'use strict';

  /* ------------------------- CONFIGURACIÓN ------------------------- */
  const CONFIG = {
    // Música: YouTube JRH_bZFvxzM, de 0:00 a 1:03
    music: { id: 'JRH_bZFvxzM', start: 0, end: 63, volume: 75, fadeIn: 1, fadeOut: 2.2, loop: true },
    // Fecha/hora de la ceremonia (Chile, UTC-3 en diciembre)
    weddingDate: '2026-12-01T12:30:00-03:00',
    // RSVP: número de WhatsApp (formato internacional, sin +) que recibe las respuestas.
    // Opcional: 'endpoint' (Formspree, Google Apps Script, etc.) recibe además un POST JSON.
    rsvp: { whatsapp: '56940477658', endpoint: '' },
    events: {
      ceremony: {
        title: 'Matrimonio civil · Darío & Josefa',
        start: '20261201T153000Z', end: '20261201T163000Z', // 12:30–13:30 hora Chile
        location: 'Registro Civil e Identificación, Oficina Vitacura, Av. Bicentenario 3800, Vitacura',
        details: 'Ceremonia civil de Darío y Josefa.'
      },
      lunch: {
        title: 'Almuerzo de matrimonio · Darío & Josefa',
        start: '20261201T170000Z', end: '20261201T220000Z', // 14:00–19:00 hora Chile
        location: 'Castillo Forestal, Av. Cardenal José María Caro 390, Parque Forestal, Santiago',
        details: 'Almuerzo de celebración de Darío y Josefa.'
      }
    }
  };

  // Siempre empezar arriba (la pantalla de entrada va primero)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const $1 = (s, c = document) => c.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // Cada módulo se ejecuta aislado: si uno falla, el resto (y la pantalla de entrada) sigue funcionando.
  const safe = fn => { try { fn(); } catch (err) { console.warn('[invitación]', err); } };

  /* ============ 1) LENIS ============ */
  let lenis;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
  } else {
    // Sustituto mínimo con la misma API cuando hay movimiento reducido
    lenis = {
      stop() {}, start() {}, on() {}, raf() {},
      scrollTo(target, o = {}) {
        const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + (o.offset || 0);
        window.scrollTo({ top: y, behavior: o.immediate ? 'auto' : 'smooth' });
      }
    };
  }
  lenis.stop(); // bloqueado hasta abrir la invitación

  /* ============ PANTALLA DE ENTRADA ============ */
  const intro = $1('#intro');
  $1('#openBtn').addEventListener('click', () => {
    playMusic(); // gesto del usuario: cumple la política de autoplay
    const finish = () => {
      intro.style.display = 'none';
      document.body.classList.remove('is-locked');
      lenis.start();
      ScrollTrigger.refresh();
    };
    window.scrollTo(0, 0);
    if (reduce) { finish(); playHero(); return; }
    gsap.timeline()
      .to('.intro__inner', { opacity: 0, y: -24, duration: .55, ease: 'power2.in' })
      .to(intro, { yPercent: -100, duration: 1.4, ease: 'power4.inOut' }, '-=.15')
      .add(playHero, '-=.75')
      .add(finish);
  });


  /* ============ 2) GSAP + SCROLLTRIGGER ============ */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.clearScrollMemory('manual'); // no restaurar posiciones antiguas al recargar
  ScrollTrigger.config({ ignoreMobileResize: true });
  lenis.on('scroll', () => { try { ScrollTrigger.update(); } catch (err) { /* aún construyéndose */ } });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ============ 3) FLORES AMARILLAS (ilustraciones pintadas, WebP con transparencia) ============ */
  // El arte nace en la esquina inferior derecha; las demás esquinas se obtienen volteando el contenedor desde su centro.
  const CORNER = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };
  const makeImg = (src, w, h) => { const i = new Image(); i.src = src; i.alt = ''; i.decoding = 'async'; if (w) { i.width = w; i.height = h; } i.setAttribute('aria-hidden', 'true'); return i; };

  const heroFlora = [];
  $$('[data-flora]').forEach(host => {
    const [fx, fy] = CORNER[host.dataset.flora];
    const img = makeImg('flora-' + (host.dataset.variant || 'a') + '.webp');
    host.appendChild(img);
    host.style.transform = 'scale(' + fx + ',' + fy + ')';
    if (reduce) return;
    gsap.set(img, { transformOrigin: '100% 100%' });
    const inHero = !!host.closest('.hero');
    const tl = gsap.timeline({ paused: inHero, scrollTrigger: inHero ? undefined : { trigger: host, start: 'top 94%', once: true } });
    tl.from(img, { opacity: 0, x: 70, y: 70, rotation: 7, duration: 2.1, ease: 'power3.out' })
      .add(() => gsap.to(img, { rotation: -1.8, duration: 4.5 + Math.random() * 2, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    if (inHero) heroFlora.push(tl);
  });

  // Separadores: guirnalda que se abre desde el centro
  $$('[data-divider]').forEach(host => {
    const img = makeImg('guirnalda.webp', 1800, 270);
    host.appendChild(img);
    if (reduce) return;
    gsap.fromTo(img, { clipPath: 'inset(0 50% 0 50%)', opacity: 0 }, { clipPath: 'inset(0 0% 0 0%)', opacity: 1, duration: 1.9, ease: 'power3.inOut', scrollTrigger: { trigger: host, start: 'top 92%', once: true } });
  });

  /* ============ TEXTOS: separar en palabras para stagger ============ */
  function splitWords(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim());
    walk(el);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  }

  $$('[data-split]').forEach(el => {
    splitWords(el);
    if (reduce) return;
    gsap.from($$('.wi', el), { yPercent: 118, duration: 1.2, stagger: .08, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* Reveals generales al hacer scroll */
  if (!reduce) {
    const items = $$('[data-reveal]');
    gsap.set(items, { y: 38 });
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: .13, ease: 'power3.out', overwrite: true })
    });

    // Parallax suave de la fachada del castillo
    $$('[data-parallax]').forEach(img => {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

  }

  /* Entrada del hero (se ejecuta al abrir la invitación) */
  function playHero() {
    try { heroFlora.forEach(t => t.play()); } catch (err) { /* aún no creadas */ }
    if (reduce) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero .eyebrow[data-hero], .hero__scriptdate', { opacity: 1, duration: 1, stagger: .2 }, 0)
      .fromTo('.couple', { y: 70, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: 1.6, ease: 'power4.out' }, .4)
      .to('.hero__join', { opacity: 1, duration: 1 }, 1.4)
      .set('.names', { opacity: 1 }, 1.6)
      .from('.names span', { y: 40, opacity: 0, filter: 'blur(10px)', duration: 1.4, stagger: .22 }, 1.65)
      .to('.hero__date', { opacity: 1, duration: 1 }, 2.3)
      .to('.scrollcue', { opacity: 1, duration: 1 }, 2.7);
  }

  /* ============ STORYTELLING ============ */
  // Barra de progreso del recorrido
  if (!reduce) gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
  else $1('#progress').style.display = 'none';

  // Palabras que se "encienden" con el scroll
  function splitScrub(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    return words.map((w, i) => {
      const s = document.createElement('span'); s.className = 'sw'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
  }

  // Capítulo I: dos fotos de niños se acercan y florece la margarita
  safe(function story() {
    const section = $1('#historia'); if (!section) return;
    const d = $1('.polaroid--d'), jo = $1('.polaroid--j'), daisy = $1('.story__daisy'), stage = $1('.story__stage');
    const words = splitScrub($1('#storyText'));
    const sw = () => stage.offsetWidth;
    const endX = () => sw() * (sw() < 520 ? .21 : .07);   // en celular las fotos no se tapan al juntarse
    if (reduce) {
      gsap.set(d, { x: () => -sw() * .12, rotation: -3 }); gsap.set(jo, { x: () => sw() * .12, rotation: 3 });
      gsap.set(daisy, { opacity: 0 }); return;
    }
    gsap.set(daisy, { scale: 0, opacity: 0 });
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: section, start: 'top top', end: '+=230%', pin: '.story__pin', scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.fromTo(d,  { x: () => -sw() * .62, y: 50, rotation: -16, opacity: 0 }, { x: () => -sw() * .27, y: 0, rotation: -6, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
      .fromTo(jo, { x: () => sw() * .62, y: 50, rotation: 16, opacity: 0 }, { x: () => sw() * .27, y: 0, rotation: 5, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
      .to(words, { opacity: 1, duration: .3, stagger: { each: .1 } }, .5)
      .to(d,  { x: () => -endX(), rotation: -3, duration: 1.1, ease: 'power2.inOut' }, 1.9)
      .to(jo, { x: () => endX(), rotation: 3, duration: 1.1, ease: 'power2.inOut' }, 1.9)
      .to(daisy, { scale: 1, opacity: 1, rotation: 180, duration: .9, ease: 'back.out(1.8)' }, 2.5)
      .to({}, { duration: .5 });
  });

  // Capítulo II: la margarita recorre el día, de la ceremonia al almuerzo
  safe(function journey() {
    const track = $1('#track'); if (!track) return;
    if (reduce) { track.style.setProperty('--p', 1); return; }
    gsap.to(track, { '--p': 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 75%', end: 'bottom 40%', scrub: .6 } });
  });

  // Mascotas: aparecen una a una en lugares distintos del recorrido, parpadean, miran y ladean la cabeza
  safe(function pets() {
    const PETS = {
      kero: { src: 'mascota-kero.webp', alt: 'Kero, gatito negro y esponjoso con una margarita en la oreja', w: 410, h: 600,
        eyes: [{ cx: 147, cy: 230, rx: 22, ry: 21, fur: '#2c2823', iris: '#59492b' }, { cx: 260, cy: 228, rx: 22, ry: 21, fur: '#36322e', iris: '#5d5535' }] },
      maru: { src: 'mascota-maru.webp', alt: 'Maru, gata gris y blanca de pelo largo con una margarita en la oreja', w: 445, h: 600,
        eyes: [{ cx: 187, cy: 137, rx: 18, ry: 17, fur: '#a29b90', iris: '#494321' }, { cx: 277, cy: 142, rx: 18, ry: 17, fur: '#b1a79d', iris: '#544d26' }] },
      flo: { src: 'mascota-flo.webp', alt: 'Flo, perrita blanca crema de pelo largo con una margarita en la oreja', w: 452, h: 600,
        eyes: [{ cx: 203, cy: 134, rx: 15, ry: 16, fur: '#e6d0ae', iris: '#423229' }, { cx: 311, cy: 128, rx: 15, ry: 16, fur: '#e8cfb5', iris: '#3f2f26' }] },
      sato: { src: 'mascota-sato.webp', alt: 'Sato, gato naranjo de pelo largo con pechera blanca y una margarita en la oreja', w: 366, h: 600,
        eyes: [{ cx: 160, cy: 130, rx: 17, ry: 15, fur: '#f1d3ab', iris: '#8d7f54' }, { cx: 237, cy: 132, rx: 17, ry: 15, fur: '#f1c997', iris: '#5f4d31' }] }
    };

    // Construye el "rig": imagen + ojos (iris desplazable) + párpados
    function buildRig(host) {
      const P = PETS[host.dataset.pet]; if (!P) return null;
      const rig = document.createElement('div'); rig.className = 'rig'; rig.style.setProperty('--ar', P.w + ' / ' + P.h);
      const img = new Image(); img.src = P.src; img.alt = P.alt; img.width = P.w; img.height = P.h; img.draggable = false; img.loading = 'lazy';
      rig.appendChild(img);
      const eyes = P.eyes.map(e => {
        const box = document.createElement('span'); box.className = 'eye';
        box.style.cssText = 'left:' + ((e.cx - e.rx) / P.w * 100) + '%;top:' + ((e.cy - e.ry) / P.h * 100) + '%;width:' + (e.rx * 2 / P.w * 100) + '%;height:' + (e.ry * 2 / P.h * 100) + '%;background:' + e.iris;
        const iris = document.createElement('span'); iris.className = 'eye__iris';
        iris.style.cssText = 'background-image:url(' + P.src + ');background-size:' + (P.w / (e.rx * 2) * 100) + '% ' + (P.h / (e.ry * 2) * 100) + '%;background-position:' + ((e.cx - e.rx) / (P.w - e.rx * 2) * 100) + '% ' + ((e.cy - e.ry) / (P.h - e.ry * 2) * 100) + '%';
        const lid = document.createElement('span'); lid.className = 'eye__lid'; lid.style.background = e.fur;
        box.appendChild(iris); box.appendChild(lid); rig.appendChild(box);
        return { iris, lid };
      });
      host.insertBefore(rig, host.firstChild);
      return { rig, eyes, name: $1('.peeker__name', host) };
    }

    // Vida: parpadeo, mirada que se pasea, inclinación de cabeza y seguimiento del cursor
    function animate(host, p) {
      const { rig, eyes, name } = p;
      let follow = null, tilt = 0;
      const setGaze = (gx, gy, dur) => eyes.forEach(e => gsap.to(e.iris, { xPercent: gx * 20, yPercent: gy * 15, duration: dur || .35, ease: 'power2.out', overwrite: 'auto' }));
      const setTilt = (deg, dur) => gsap.to(rig, { rotation: deg, duration: dur || 1.1, ease: 'sine.inOut', overwrite: 'auto' });
      const blink = (double) => {
        const t = gsap.timeline();
        eyes.forEach(e => t.to(e.lid, { scaleY: 1, duration: .07, ease: 'power1.in' }, 0).to(e.lid, { scaleY: 0, duration: .12, ease: 'power1.out' }, .09));
        if (double) eyes.forEach(e => t.to(e.lid, { scaleY: 1, duration: .07 }, .3).to(e.lid, { scaleY: 0, duration: .12 }, .39));
      };
      let blinkTimer, lookTimer;
      const scheduleBlink = () => { blinkTimer = setTimeout(() => { blink(Math.random() < .2); scheduleBlink(); }, 2200 + Math.random() * 3800); };
      const scheduleLook = () => {
        lookTimer = setTimeout(() => {
          if (!follow) { const gx = (Math.random() * 2 - 1), gy = (Math.random() * 1.4 - .7); setGaze(gx, gy, .45); tilt = gx * 3; setTilt(tilt, 1.4); if (Math.random() < .3) setTimeout(() => { if (!follow) { setGaze(0, 0, .5); setTilt(0, 1.6); } }, 900); }
          scheduleLook();
        }, 1500 + Math.random() * 2600);
      };
      // respiración suave
      gsap.to(rig, { scaleY: 1.014, duration: 2.4 + Math.random(), yoyo: true, repeat: -1, ease: 'sine.inOut' });

      // cursor: la mirada y la cabeza lo siguen cuando está cerca
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        window.addEventListener('pointermove', ev => {
          const b = rig.getBoundingClientRect(); const cx = b.left + b.width / 2, cy = b.top + b.height * .26;
          const dx = ev.clientX - cx, dy = ev.clientY - cy, dist = Math.hypot(dx, dy);
          if (b.bottom < 0 || b.top > innerHeight) return;
          if (dist < 520) { follow = true; setGaze(clamp(dx / 260, -1, 1), clamp(dy / 260, -1, 1), .25); setTilt(clamp(dx / 260, -1, 1) * 4, .6); }
          else if (follow) { follow = null; setGaze(0, 0, .5); setTilt(0, 1.2); }
        }, { passive: true });
      }
      // saludo al tocar / pasar el cursor
      const hello = () => { blink(true); gsap.fromTo(rig, { scale: 1 }, { scale: 1.05, duration: .22, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '50% 100%' }); if (name) gsap.fromTo(name, { scale: 1 }, { scale: 1.18, duration: .25, yoyo: true, repeat: 1, ease: 'back.out(3)' }); };
      rig.addEventListener('pointerenter', hello);
      rig.addEventListener('click', hello);
      scheduleBlink(); scheduleLook();
    }

    const mode = h => (h.className.match(/peeker--(\w+)/) || [])[1];
    $$('.peeker').forEach(host => {
      const p = buildRig(host); if (!p) return;
      if (reduce) return;
      const m = mode(host);
      const from = { ledge: { yPercent: 108 }, over: { yPercent: 70 }, edge: { x: () => -rigW(p) * 1.1, rotation: -14 }, below: { yPercent: 80 } }[m];
      gsap.set(p.rig, { ...(from || {}), opacity: m === 'ledge' ? 1 : 0 });
      gsap.set(p.name, { opacity: 0, y: 10 });
      ScrollTrigger.create({
        trigger: m === 'ledge' ? host.parentElement : host, start: m === 'edge' ? 'top 75%' : 'top 92%', once: true,
        onEnter() {
          gsap.to(p.rig, { yPercent: 0, x: 0, rotation: 0, opacity: 1, duration: m === 'edge' ? 1.7 : 1.4, ease: m === 'edge' ? 'elastic.out(1,.6)' : 'back.out(1.5)',
            onComplete() { animate(host, p); } });
          gsap.to(p.name, { opacity: 1, y: 0, duration: 1, delay: .7, ease: 'power3.out' });
        }
      });
      function rigW(q) { return q.rig.offsetWidth; }
    });
  });

  // Fachada del castillo: se abre como un arco al entrar
  if (!reduce) $$('.arch__frame').forEach(f => {
    gsap.fromTo(f, { clipPath: 'inset(22% 14% 0% 14% round 999px 999px 0 0)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)', duration: 1.8, ease: 'power4.out', scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
  });

  /* Imanes en los botones (solo puntero fino) */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        xTo((e.clientX - (b.left + b.width / 2)) * .22);
        yTo((e.clientY - (b.top + b.height / 2)) * .3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* Cabecera sólida al hacer scroll + anclas con Lenis */
  const topbar = $1('#topbar');
  window.addEventListener('scroll', () => topbar.classList.toggle('is-solid', window.scrollY > 40), { passive: true });
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $1(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    });
  });

  /* ============ 5) MÚSICA · YouTube IFrame API ============ */
  const musicBtn = $1('#musicBtn');
  const M = CONFIG.music;
  let player = null, ytReady = false, wantPlay = false, ticker = null, wasPlayingBeforeHidden = false, lastVol = -1;

  function setUi(playing) {
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.setAttribute('aria-pressed', String(playing));
    musicBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
  }
  function volumeAt(t) {
    const up = M.fadeIn ? (t - M.start) / M.fadeIn : 1;
    const down = M.fadeOut ? (M.end - t) / M.fadeOut : 1;
    return Math.round(M.volume * clamp(Math.min(up, down), 0, 1));
  }
  function startTicker() {
    stopTicker();
    ticker = setInterval(() => {
      if (!player || !player.getCurrentTime) return;
      const t = player.getCurrentTime();
      if (t >= M.end - .05) {                 // llegó a 1:03
        if (M.loop) { lastVol = -1; player.seekTo(M.start, true); player.setVolume(0); }
        else { player.pauseVideo(); player.seekTo(M.start, true); }
        return;
      }
      const v = volumeAt(t);
      if (v !== lastVol) { player.setVolume(v); lastVol = v; }
    }, 120);
  }
  function stopTicker() { clearInterval(ticker); ticker = null; }

  function playMusic() {
    if (!ytReady) { wantPlay = true; return; }
    player.setVolume(0); lastVol = 0;
    if (player.getCurrentTime() >= M.end - .2) player.seekTo(M.start, true);
    player.playVideo();
  }
  function pauseMusic() { wantPlay = false; if (ytReady) player.pauseVideo(); }

  window.onYouTubeIframeAPIReady = function () {
    const vars = { controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, start: M.start };
    if (/^https?:$/.test(location.protocol)) vars.origin = location.origin; // en file:// no se envía
    player = new YT.Player('yt-player', {
      width: '200', height: '200', videoId: M.id, playerVars: vars,
      events: {
        onReady() { ytReady = true; if (wantPlay) { wantPlay = false; playMusic(); } },
        onStateChange(e) {
          if (e.data === YT.PlayerState.PLAYING) { setUi(true); startTicker(); }
          else if (e.data === YT.PlayerState.PAUSED) { setUi(false); stopTicker(); }
          else if (e.data === YT.PlayerState.ENDED) { stopTicker(); setUi(false); }
        },
        onAutoplayBlocked() { setUi(false); },
        onError(e) { setUi(false); musicBtn.title = 'La música no está disponible (código ' + e.data + ')'; console.warn('YouTube error', e.data); }
      }
    });
  };
  (function loadYT() {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
  })();

  musicBtn.addEventListener('click', () => { musicBtn.classList.contains('is-playing') ? pauseMusic() : playMusic(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { wasPlayingBeforeHidden = musicBtn.classList.contains('is-playing'); if (wasPlayingBeforeHidden) player.pauseVideo(); }
    else if (wasPlayingBeforeHidden) { playMusic(); }
  });

  // Entrada animada de la propia pantalla de bienvenida
  if (!reduce) {
    gsap.from('.intro__inner > *', { y: 28, opacity: 0, duration: 1.3, stagger: .18, ease: 'power3.out', delay: .4 });
  }

  /* ============ CUENTA REGRESIVA ============ */
  const target = new Date(CONFIG.weddingDate).getTime();
  const pad = n => String(n).padStart(2, '0');
  const cd = { d: $1('#cd-d'), h: $1('#cd-h'), m: $1('#cd-m'), s: $1('#cd-s') };
  function tick() {
    const diff = Math.max(0, target - Date.now());
    cd.d.textContent = pad(Math.floor(diff / 864e5));
    cd.h.textContent = pad(Math.floor(diff / 36e5) % 24);
    cd.m.textContent = pad(Math.floor(diff / 6e4) % 60);
    cd.s.textContent = pad(Math.floor(diff / 1e3) % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ============ AÑADIR AL CALENDARIO ============ */
  const icsEscape = s => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  function googleUrl(ev) {
    const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${ev.start}/${ev.end}`, details: ev.details, location: ev.location });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }
  function downloadIcs(ev, name) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dario y Josefa//Invitacion//ES', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', `UID:${name}-${ev.start}@invitacion-dario-josefa`, `DTSTAMP:${stamp}`,
      `DTSTART:${ev.start}`, `DTEND:${ev.end}`, `SUMMARY:${icsEscape(ev.title)}`,
      `LOCATION:${icsEscape(ev.location)}`, `DESCRIPTION:${icsEscape(ev.details)}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana es el gran día', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  $$('.cal').forEach(box => {
    const key = box.dataset.cal, ev = CONFIG.events[key];
    const btn = $1('button', box), menu = $1('.cal__menu', box);
    $1('[data-cal-google]', box).href = googleUrl(ev);
    $1('[data-cal-ics]', box).addEventListener('click', e => { e.preventDefault(); downloadIcs(ev, key === 'ceremony' ? 'ceremonia-civil' : 'almuerzo'); close(); });
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.hidden;
      $$('.cal__menu').forEach(m => { m.hidden = true; });
      $$('.cal button').forEach(b => b.setAttribute('aria-expanded', 'false'));
      menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      if (open && !reduce) gsap.from(menu, { y: -8, opacity: 0, duration: .4, ease: 'power3.out' });
    });
    document.addEventListener('click', e => { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  });

  /* ============ RSVP: Sí / No -> WhatsApp ============ */
  const form = $1('#rsvpForm'), errBox = $1('#rsvpError');

  function buildMessage(name, yes) {
    return yes
      ? '¡Hola, Darío y Josefa! 💛\nSoy ' + name + ' y ¡claro que estaré ahí! Gracias por invitarme a vivir con ustedes un día tan especial. Los quiero mucho. 🌼'
      : 'Hola, Darío y Josefa 💛\nSoy ' + name + '. Me da mucha pena, pero no podré acompañarlos. Los abrazo con todo mi cariño y les deseo un día lleno de amor. 🌼';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const attend = fd.get('attend');
    errBox.hidden = true;
    if (!name) return showError('Por favor, escribe tu nombre.', $1('#rsvp-name'));
    if (!attend) return showError('Cuéntanos si podrás asistir.', $1('.choice input'));

    const yes = attend === 'yes';
    const waUrl = 'https://wa.me/' + CONFIG.rsvp.whatsapp + '?text=' + encodeURIComponent(buildMessage(name, yes));

    if (CONFIG.rsvp.endpoint) {
      fetch(CONFIG.rsvp.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name, attend }) }).catch(() => {});
    }
    window.open(waUrl, '_blank', 'noopener');

    $1('#thanksTitle').textContent = yes ? '¡Gracias, nos vemos!' : 'Gracias por avisarnos';
    $1('#thanksText').textContent = yes
      ? 'Tu mensaje está listo en WhatsApp: solo falta que lo envíes. Si no se abrió, toca el botón.'
      : 'Te vamos a extrañar, pero agradecemos tu cariño. Si no se abrió WhatsApp, toca el botón.';
    const link = $1('#thanksLink'); link.href = waUrl; link.hidden = false;

    const thanks = $1('#rsvpThanks');
    form.hidden = true; thanks.hidden = false;
    if (!reduce) gsap.from(thanks.children, { y: 30, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out' });
    thanks.focus({ preventScroll: true });
    lenis.scrollTo($1('#rsvp'), { offset: 0, duration: 1.2 });
    ScrollTrigger.refresh();
  });
  function showError(msg, field) {
    errBox.textContent = msg; errBox.hidden = false;
    if (field) field.focus();
    if (!reduce) gsap.fromTo(errBox, { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1,.4)' });
  }

  /* Recalcular posiciones cuando carguen fuentes e imágenes */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => safe(() => ScrollTrigger.refresh()));
  window.addEventListener('load', () => safe(() => ScrollTrigger.refresh()));
})();
