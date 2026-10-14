/* Blahar & Benyah — Showcase interactions (no dependencies) */
(function () {
  'use strict';
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(pointer: fine)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header: solid after scroll, hide on scroll down ---------- */
  var hdr = $('#hdr'), progress = $('.progress'), totop = $('.totop');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    hdr.classList.toggle('is-solid', y > 40);
    hdr.classList.toggle('is-hidden', y > 360 && y > lastY && !menuOpen);
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (totop) totop.classList.toggle('is-on', y > 700);
    stackScale();
    parallax();
    activeLink(y);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Active nav link ---------- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav a');
  function activeLink(y) {
    var current = '';
    sections.forEach(function (s) { if (y + 140 >= s.offsetTop) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + current); });
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('.burger'), menu = $('#menu'), menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    if (open) { menu.removeAttribute('inert'); menu.inert = false; } else { menu.setAttribute('inert', ''); menu.inert = true; }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) hdr.classList.remove('is-hidden');
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!menuOpen); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }

  /* ---------- Rotating hero word ---------- */
  var swap = $('#swap');
  if (swap && !reduce) {
    var words = ['Freight', 'Containers', 'Your goods', 'Businesses', 'Ghana'];
    var idx = 0;
    setInterval(function () {
      var old = $('.swap__word', swap);
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
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('en-GB');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Sticky service cards: scale the card being covered ---------- */
  var cards = $$('.s-card');
  function stackScale() {
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
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); d.setAttribute('aria-selected', i === cur ? 'true' : 'false'); });
    }
    function play() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(cur + 1); }, 6000); }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); play(); }); });
    slider.parentNode.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.parentNode.addEventListener('mouseleave', play);
    play();
  }

  /* ---------- Magnetic buttons + custom cursor (desktop only) ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
    var cursor = $('.cursor'), cx = 0, cy = 0, tx = 0, ty = 0, shown = false;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; cx = tx; cy = ty; cursor.classList.add('is-on'); } });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); shown = false; });
    document.addEventListener('mouseover', function (e) { cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .s-card, .reason')); });
    (function loop() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
  }

  /* ---------- Demo form: post to (mocked) contact.php, show reply inline ---------- */
  $$('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var b = f.querySelector('[type=submit]'), st = f.querySelector('.form-status');
      b.disabled = true; st.textContent = 'Sending\u2026'; st.className = 'form-status';
      fetch(f.getAttribute('action'), { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(f) })
        .then(function (r) { return r.json(); })
        .then(function (j) { st.textContent = j.message || 'Thank you \u2014 we will get back to you shortly.'; st.className = 'form-status ok'; f.reset(); })
        .catch(function () { st.textContent = 'Could not send. Please call or WhatsApp us.'; st.className = 'form-status err'; })
        .then(function () { b.disabled = false; });
    });
  });

  onScroll();
})();
