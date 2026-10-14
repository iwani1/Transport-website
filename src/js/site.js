/* Blahar & Benyah — site interactions (no dependencies).
 * Everything here is progressive enhancement: the pages read fine without it.
 * Form submission lives in forms.js. */
(function () {
  'use strict';
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(pointer: fine)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

  /* ---------- Header: solid after scroll, hide on scroll down ---------- */
  var hdr = $('#hdr'), progress = $('.progress'), totop = $('.totop');
  var lastY = 0, menuOpen = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (hdr) {
      hdr.classList.toggle('is-solid', y > 40);
      hdr.classList.toggle('is-hidden', y > 360 && y > lastY && !menuOpen);
    }
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (totop) totop.classList.toggle('is-on', y > 700);
    stackScale();
    parallax();
    activeLink(y);
    journey();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Active nav link (home page hash links only) ---------- */
  var sections = $$('main section[id]');
  var hashLinks = $$('.nav a[href^="/#"], .nav a[href^="#"]');
  function activeLink(y) {
    if (!hashLinks.length) return;
    var current = '';
    sections.forEach(function (s) { if (y + 140 >= s.offsetTop) current = s.id; });
    hashLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href').replace(/^\//, '') === '#' + current); });
  }

  /* ---------- Full-screen menu ---------- */
  var burger = $('.burger'), menu = $('#menu');
  /* Everything except the header's burger button and the menu itself is made inert while the
   * overlay is open, so keyboard and screen-reader users cannot wander behind it. */
  var behind = $$('#content, main, .foot, .fab, .totop, .hdr .brand, .hdr .nav, .hdr__phone, .hdr .btn');
  function setInert(el, on) { if (on) { el.setAttribute('inert', ''); el.inert = true; } else { el.removeAttribute('inert'); el.inert = false; } }
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    setInert(menu, !open);
    behind.forEach(function (el) { setInert(el, open); });
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && hdr) hdr.classList.remove('is-hidden');
    if (open) { var first = $('a', menu); if (first) first.focus(); } else { burger.focus(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menuOpen); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }

  /* ---------- Rotating hero word ---------- */
  var swap = $('#swap');
  if (swap && !reduce) {
    var words = (swap.getAttribute('data-words') || 'Freight|Containers|Your goods|Businesses|Ghana').split('|');
    var idx = 0;
    setInterval(function () {
      var old = $('.swap__word', swap);
      if (!old) return;
      idx = (idx + 1) % words.length;
      var next = document.createElement('span');
      next.className = 'swap__word is-in';
      next.textContent = words[idx];
      old.classList.remove('is-in');
      old.classList.add('is-out');
      old.style.position = 'absolute';
      old.style.left = '0';
      swap.appendChild(next);
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 500);
    }, 2600);
  }

  /* ---------- Reveal on scroll + counters + steps ---------- */
  var watched = $$('[data-reveal], [data-count], [data-steps]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        if (en.target.hasAttribute('data-count')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) { el.classList.add('is-visible'); if (el.hasAttribute('data-count')) countUp(el); });
  }

  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10), start = null, dur = reduce ? 1 : 1800;
    if (isNaN(end)) return;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('en-GB');
      if (p < 1) raf(frame);
    }
    raf(frame);
  }

  /* ---------- Sticky service cards: scale the card being covered ---------- */
  var cards = $$('.s-card');
  function stackScale() {
    if (!cards.length) return;
    if (reduce || window.innerWidth < 900) { cards.forEach(function (c) { c.style.transform = ''; c.style.filter = ''; }); return; }
    for (var i = 0; i < cards.length - 1; i++) {
      var card = cards[i], next = cards[i + 1];
      var rect = card.getBoundingClientRect(), nextTop = next.getBoundingClientRect().top;
      var covered = Math.min(Math.max((rect.bottom - nextTop) / rect.height, 0), 1);
      card.style.transform = 'scale(' + (1 - covered * 0.06) + ')';
      card.style.filter = 'brightness(' + (1 - covered * 0.35) + ')';
    }
  }

  /* ---------- Parallax backgrounds ---------- */
  var plx = $$('[data-parallax]');
  function parallax() {
    if (reduce) return;
    plx.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      var offset = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
    });
  }

  /* ---------- Testimonial slider ---------- */
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('.slide', slider), dots = $$('.dots button'), cur = 0, timer;
    var go = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); d.setAttribute('aria-selected', i === cur ? 'true' : 'false'); });
    };
    var wrap = slider.parentNode, stopped = false;
    wrap.classList.add('slider-wrap');
    var pause = function () { clearInterval(timer); timer = null; };
    var play = function () { pause(); if (!reduce && !stopped && !document.hidden && slides.length > 1) timer = setInterval(function () { go(cur + 1); }, 6000); };
    /* Choosing a slide hands control to the visitor: auto-rotation stops for good. */
    dots.forEach(function (d, i) { d.addEventListener('click', function () { stopped = true; wrap.classList.add('is-paused'); pause(); go(i); }); });
    wrap.addEventListener('mouseenter', pause);
    wrap.addEventListener('mouseleave', play);
    wrap.addEventListener('focusin', pause);
    wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) play(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });
    play();
  }

  /* ---------- Google map: inserted only when asked for ---------- */
  $$('[data-map]').forEach(function (box) {
    var btn = $('[data-map-load]', box);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = box.getAttribute('data-map-title') || 'Map';
      f.setAttribute('loading', 'eager');
      f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      f.setAttribute('allowfullscreen', '');
      f.tabIndex = 0;
      box.textContent = '';
      box.appendChild(f);
      box.classList.add('is-loaded');
      f.focus();
    });
  });

  /* ---------- The Journey: scroll-driven truck scene ----------
   * The section is ~4 screens tall with a sticky stage. Scroll progress p (0..1)
   * drives every layer, so scrubbing back and forth replays the trip. */
  var jr = $('.journey');
  var J = null;
  if (jr) {
    if (reduce) {
      jr.classList.add('journey--static');
      $$('.cap', jr).forEach(function (c) { c.classList.add('is-on'); });
      $$('.hud__track b', jr).forEach(function (b) { b.classList.add('is-on'); });
      var kmEl = $('.hud__km span', jr);
      if (kmEl) kmEl.textContent = kmEl.getAttribute('data-km') || '250';
    } else {
      J = {
        stage: $('.journey__stage', jr),
        port: $('.jl-port', jr), city: $('.jl-city', jr),
        hills: $('.jl-hills', jr), palms: $('.jl-palms', jr), posts: $('.jl-posts', jr), lines: $('.jl-lines', jr),
        night: $('.jl-night', jr), stars: $('.jl-stars', jr), sun: $('.jl-sun', jr),
        truck: $('.truck', jr), wheels: $$('.truck .wheel', jr),
        km: $('.hud__km span', jr), bar: $('.hud__track i', jr), dots: $$('.hud__track b', jr),
        caps: $$('.cap', jr), total: 250, last: -1
      };
      if (J.km) J.total = parseInt(J.km.getAttribute('data-km'), 10) || 250;
    }
  }
  var CAP_RANGES = [[0, 0.22], [0.22, 0.48], [0.48, 0.78], [0.78, 1.01]];
  function journey() {
    if (!J) return;
    var rect = jr.getBoundingClientRect();
    var vh = window.innerHeight;
    var travel = rect.height - vh;
    if (travel <= 0) return;
    if (rect.top > vh || rect.bottom < 0) return; /* off-screen: skip the work */
    var p = Math.min(Math.max(-rect.top / travel, 0), 1);
    if (Math.abs(p - J.last) < 0.0005) return;
    J.last = p;
    var vw = window.innerWidth;
    var dist = p * 4000; /* "pixels of road" travelled */
    /* Far layers leave / arrive */
    if (J.port) J.port.style.transform = 'translateX(' + (-p * 1.6 * vw).toFixed(1) + 'px)';
    if (J.city) J.city.style.transform = 'translateX(' + ((1 - p) * 1.2 * vw).toFixed(1) + 'px)';
    /* Repeating layers scroll at different speeds (parallax) */
    if (J.hills) J.hills.style.backgroundPositionX = (-dist * 0.28).toFixed(1) + 'px';
    if (J.palms) J.palms.style.backgroundPositionX = (-dist * 0.55).toFixed(1) + 'px';
    if (J.posts) J.posts.style.backgroundPositionX = (-dist * 1.0).toFixed(1) + 'px';
    if (J.lines) J.lines.style.backgroundPositionX = (-dist * 1.0).toFixed(1) + 'px';
    /* Day -> night */
    if (J.night) J.night.style.opacity = Math.pow(p, 1.4).toFixed(3);
    if (J.stars) J.stars.style.opacity = Math.max(0, (p - 0.4) / 0.6).toFixed(3);
    if (J.sun) J.sun.style.transform = 'translate(-50%,' + (-50 + p * 260).toFixed(1) + '%)';
    if (J.stage) J.stage.classList.toggle('is-night', p > 0.45);
    /* Truck: wheels, bob, a hint of pitch when braking at the end */
    var deg = (dist / (Math.PI * 56)) * 360;
    J.wheels.forEach(function (w) { w.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)'; });
    var bob = Math.sin(dist / 38) * 1.6;
    var ease = p < 0.06 ? p / 0.06 : (p > 0.94 ? (1 - p) / 0.06 : 1);
    var pitch = (p > 0.94 ? -(1 - ease) * 1.5 : 0);
    if (J.truck) J.truck.style.transform = 'translateY(' + (bob * ease).toFixed(2) + 'px) rotate(' + pitch.toFixed(2) + 'deg)';
    /* HUD */
    if (J.km) J.km.textContent = Math.round(p * J.total).toLocaleString('en-GB');
    if (J.bar) J.bar.style.width = (p * 100).toFixed(2) + '%';
    J.dots.forEach(function (d, i) { d.classList.toggle('is-on', p >= [0, 0.33, 0.66, 0.99][i]); });
    J.caps.forEach(function (c, i) {
      var r = CAP_RANGES[i] || [2, 3];
      c.classList.toggle('is-on', p >= r[0] && p < r[1]);
    });
  }

  /* ---------- Magnetic buttons + custom cursor (desktop only) ---------- */
  var cursor = $('.cursor');
  if (fine && !reduce && cursor) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
    var cx = 0, cy = 0, tx = 0, ty = 0, shown = false;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; cx = tx; cy = ty; cursor.classList.add('is-on'); } });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); shown = false; });
    document.addEventListener('mouseover', function (e) { cursor.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, .s-card, .reason, .tile, .value'))); });
    (function loop() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; raf(loop); })();
  }

  /* ---------- Conversion tracking ----------
   * Sends the same events to Plausible ("Form sent", "WhatsApp click", ...) and to GA4
   * (snake_case: form_sent, whatsapp_click, phone_click, email_click). Does nothing
   * until an analytics ID is set in site.json. */
  function track(name, props) {
    props = props || {};
    props.page = location.pathname;
    try {
      if (typeof window.plausible === 'function') window.plausible(name, { props: props });
      if (typeof window.gtag === 'function') window.gtag('event', name.toLowerCase().replace(/\s+/g, '_'), props);
    } catch (e) { /* analytics must never break the page */ }
  }
  function placementOf(el) {
    if (el.classList.contains('fab')) return 'fab';
    if (el.closest('.menu')) return 'menu';
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.cta')) return 'cta';
    if (el.closest('.hero, .phero')) return 'hero';
    if (el.closest('form, .aside, .panel')) return 'aside';
    return 'content';
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^tel:/i.test(href)) track('Phone click', { placement: placementOf(a), number: href.slice(4) });
    else if (/^mailto:/i.test(href)) track('Email click', { placement: placementOf(a) });
    else if (/wa\.me|whatsapp\.com/i.test(href)) track('WhatsApp click', { placement: placementOf(a) });
  });
  document.addEventListener('form:sent', function (e) {
    var d = e.detail || {};
    track('Form sent', { form: d.form || 'contact', service: d.service || '' });
  });
  if (/\/thank-you\.html$/.test(location.pathname)) track('Form sent', { form: 'redirect', service: '' });

  /* ---------- Hero video: only download/play when allowed ---------- */
  var vid = $('.hero__video');
  if (vid) {
    if (reduce || mq('(max-width: 760px)')) { vid.removeAttribute('autoplay'); vid.pause && vid.pause(); vid.parentNode.removeChild(vid); }
    else { vid.addEventListener('canplay', function () { vid.classList.add('is-ready'); }); var pl = vid.play && vid.play(); if (pl && pl.catch) pl.catch(function () {}); }
  }

  onScroll();
})();
