/* RightHire: minimal vanilla JS (nav, reveals, hero animation, micro-interactions, mailto form) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Nav: glass on scroll + mobile menu */
  var nav = document.querySelector('.nav-wrap');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  var setMenu = function (open) {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal, .process');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Keep the illustrative shortlist visible; it is proof, not a loading state. */

  /* Spotlight + gentle tilt (desktop pointers only) */
  if (finePointer && !reduce) {
    document.querySelectorAll('.spot, .evidence-card').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    var card = document.querySelector('.tilt');
    if (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    }
  }


  /* Problem cards: tap / click / keyboard to flip */
  document.querySelectorAll('.pain').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* Pipeline: progress rail, active stage, sticky stepper */
  var stagesEl = document.getElementById('stages');
  if (stagesEl) {
    var stgs = Array.prototype.slice.call(stagesEl.querySelectorAll('.stg'));
    var links = Array.prototype.slice.call(document.querySelectorAll('#stepper a'));
    var fill = document.getElementById('stepper-fill');
    var stepList = document.querySelector('#stepper ol');
    var lastActive = -1, ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight, mark = vh * 0.55;
      var r = stagesEl.getBoundingClientRect();
      stagesEl.style.setProperty('--rail', Math.max(0, Math.min(r.height, mark - r.top - 28)) + 'px');
      var active = 0;
      stgs.forEach(function (s, i) {
        var top = s.getBoundingClientRect().top;
        var on = top < mark;
        s.classList.toggle('on', on);
        if (on) active = i + 1;
      });
      stgs.forEach(function (s, i) { s.classList.toggle('active', i + 1 === active); });
      links.forEach(function (a, i) {
        a.classList.toggle('active', i + 1 === active);
        a.classList.toggle('done', i + 1 < active);
        if (i + 1 === active) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      var prog = active <= 1 ? (active ? 0 : 0) : (active - 1) / (stgs.length - 1);
      if (fill) fill.style.setProperty('--p', (prog * 100).toFixed(1) + '%');
      if (active !== lastActive && active > 0 && stepList && stepList.scrollWidth > stepList.clientWidth) {
        var a = links[active - 1];
        stepList.scrollTo({ left: a.parentNode.offsetLeft - stepList.clientWidth / 2 + a.parentNode.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
      lastActive = active;
    };
    var onS = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onS, { passive: true });
    window.addEventListener('resize', onS);
    update();
  }

  /* Year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Pilot form: compose a mailto (nothing is sent automatically) */
  var form = document.getElementById('pilot-form');
  if (!form) return;
  var TO = 'harshakusalmayuri@gmail.com';
  var err = document.getElementById('form-error');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, ok = true;
    ['name', 'company', 'email', 'role'].forEach(function (k) {
      var el = f[k], val = el.value.trim();
      var valid = val !== '' && (k !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
      el.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid) ok = false;
    });
    err.hidden = ok;
    if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    var v = function (k) { return f[k].value.trim(); };
    var subject = 'Free shortlist request: ' + v('role') + ' at ' + v('company');
    var body = [
      'Hi Harsha,', '',
      "I'd like a free evidence-backed shortlist for one open role.", '',
      'Name: ' + v('name'),
      'Company: ' + v('company'),
      'Work email: ' + v('email'),
      'Role: ' + v('role'),
      'Location: ' + (v('location') || '-'), '',
      'Notes: ' + (v('notes') || '-'), '',
      'Thanks!'
    ].join('\n');
    var url = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    form.setAttribute('data-mailto', url);
    window.location.href = url;
  });
})();
