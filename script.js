/* Stratex Logistics — interactions and motion
   Uses Motion (motion.dev) vanilla build, vendored at js/motion.min.js */
(function () {
  'use strict';

  var root = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 960px)').matches;
  var EASE = [0.22, 1, 0.36, 1];
  var canAnimate = !!(M && M.animate) && !reduce;

  if (!M || !M.animate) root.classList.add('no-motion-lib');
  if (reduce) root.classList.remove('motion');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Split helpers ---------- */
  function splitWords(el, wrapClass) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) {
      return wrapClass === 'w'
        ? '<span class="w" aria-hidden="true"><span>' + w + '</span></span>'
        : '<span class="sw" aria-hidden="true">' + w + '</span>';
    }).join(' ');
    return $$('.' + wrapClass + (wrapClass === 'w' ? ' > span' : ''), el);
  }

  var heroWords = $$('[data-split]').reduce(function (acc, el) { return acc.concat(splitWords(el, 'w')); }, []);
  var scrubGroups = $$('[data-scrub], [data-split-scroll]').map(function (el) { return { el: el, words: splitWords(el, 'sw') }; });

  /* ---------- Footer year ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Header state ---------- */
  var header = $('#header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menu-btn'), nav = $('#nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Smooth anchor scroll ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      var top = id === '#top' ? 0 : t.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Active nav indicator ---------- */
  var navLinks = $$('[data-nav]');
  var indicator = $('.nav-indicator');
  function moveIndicator(link) {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = '0'; return; }
    var navBox = nav.getBoundingClientRect(), b = link.getBoundingClientRect();
    indicator.style.width = b.width + 'px';
    indicator.style.transform = 'translateX(' + (b.left - navBox.left) + 'px)';
    indicator.style.opacity = '1';
  }
  var sectionMap = {};
  navLinks.forEach(function (l) { sectionMap[l.getAttribute('href').slice(1)] = l; });
  var extra = { vision: 'about', services: null, intro: null, top: null, contact: null };
  var current = null;
  function setActive(id) {
    var key = Object.prototype.hasOwnProperty.call(extra, id) ? extra[id] : id;
    var link = key ? sectionMap[key] : null;
    if (link === current) return;
    current = link;
    navLinks.forEach(function (l) { l.setAttribute('aria-current', l === link ? 'true' : 'false'); });
    moveIndicator(link);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { io.observe(s); });
  }
  window.addEventListener('resize', function () { moveIndicator(current); });

  /* ---------- Service panels ---------- */
  var panels = $$('[data-panel]');
  function activatePanel(p) { panels.forEach(function (x) { x.classList.toggle('is-active', x === p); }); }
  panels.forEach(function (p) {
    p.addEventListener('mouseenter', function () { activatePanel(p); });
    p.addEventListener('focus', function () { activatePanel(p); });
    /* Touch screens with the side-by-side layout: first tap opens a panel, second tap follows the link.
       State is read on touchstart because the emulated mouseenter activates the panel before click fires. */
    var wasActive = true;
    p.addEventListener('touchstart', function () { wasActive = p.classList.contains('is-active'); }, { passive: true });
    p.addEventListener('click', function (e) {
      if (!wasActive && window.matchMedia('(hover: none) and (min-width: 961px)').matches) {
        wasActive = true;
        e.preventDefault(); e.stopImmediatePropagation(); activatePanel(p);
      }
    }, true); /* capture, so it runs before the smooth-scroll handler */
  });

  /* ---------- Accordion ---------- */
  $$('[data-accordion] .acc-btn').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (!canAnimate) { panel.hidden = open; return; }
      if (open) {
        M.animate(panel, { height: [panel.scrollHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 0.4, ease: EASE })
          .then(function () { panel.hidden = true; panel.style.height = ''; });
      } else {
        panel.hidden = false;
        var h = panel.scrollHeight;
        M.animate(panel, { height: ['0px', h + 'px'], opacity: [0, 1] }, { duration: 0.5, ease: EASE })
          .then(function () { panel.style.height = ''; });
      }
    });
  });

  /* ---------- Facility tabs + map ---------- */
  var chart = $('.network-map .chart');
  var tabs = $$('.site-tabs [role="tab"]');
  function selectSite(id, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.site === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (on) {
        panel.hidden = false;
        if (canAnimate) M.animate(panel, { opacity: [0, 1], y: [10, 0] }, { duration: 0.45, ease: EASE });
        if (focus) t.focus();
      } else { panel.hidden = true; }
    });
    if (chart) $$('.site', chart).forEach(function (s) { s.classList.toggle('is-active', s.dataset.site === id); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectSite(t.dataset.site); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectSite(n.dataset.site, true); }
    });
  });
  if (chart) $$('.site', chart).forEach(function (s) { s.addEventListener('click', function () { selectSite(s.dataset.site); }); });
  $$('[data-site-link]').forEach(function (a) { a.addEventListener('click', function () { selectSite(a.dataset.siteLink); }); });
  selectSite('valsad');

  /* ---------- Scroll-lit words (runs even without Motion) ---------- */
  function litWords(group) {
    if (reduce) { group.words.forEach(function (w) { w.classList.add('on'); }); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var r = group.el.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * group.words.length);
      group.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  scrubGroups.forEach(litWords);

  /* ---------- Contact form (Web3Forms) ---------- */
  initForm();

  if (!canAnimate) {
    var hp = $('.hero-route-path'); if (hp) hp.setAttribute('stroke-dashoffset', '0');
    return;
  }

  /* =======================================================
     Motion sequences
     ======================================================= */
  var animate = M.animate, stagger = M.stagger, scroll = M.scroll;
  /* Normalise inView callback: v11 passes an IntersectionObserverEntry, v12 passes the element */
  var inView = function (sel, cb, opts) {
    return M.inView(sel, function (a, b) { cb(a && a.target ? a.target : a, b); }, opts);
  };

  /* Hero entrance */
  animate('.hero-media img', { opacity: [0, 1], scale: [1.14, 1] }, { duration: 2.2, ease: EASE });
  /* Clear the transform afterwards: a transformed header would trap the fixed mobile menu inside it */
  animate(header, { opacity: [0, 1], y: [-12, 0] }, { duration: 0.7, delay: 0.3, ease: EASE })
    .then(function () { header.style.transform = ''; });
  animate('[data-hero="eyebrow"]', { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, delay: 0.45, ease: EASE });
  animate(heroWords, { y: ['110%', '0%'] }, { duration: 1, delay: stagger(0.06, { startDelay: 0.55 }), ease: EASE });
  var afterTitle = 0.55 + heroWords.length * 0.06 + 0.25;
  animate('[data-hero="lede"]', { opacity: [0, 1], y: [20, 0] }, { duration: 0.8, delay: afterTitle, ease: EASE });
  animate('[data-hero="cta"]', { opacity: [0, 1], y: [20, 0] }, { duration: 0.8, delay: afterTitle + 0.12, ease: EASE });
  animate('[data-hero="manifest"]', { opacity: [0, 1], y: [24, 0] }, { duration: 0.9, delay: afterTitle + 0.25, ease: EASE });
  animate('[data-hero="cue"]', { opacity: [0, 1] }, { duration: 0.8, delay: afterTitle + 0.6 });
  animate('.hero-route-path', { strokeDashoffset: [1, 0] }, { duration: 2.4, delay: 0.9, ease: [0.65, 0, 0.35, 1] });

  /* Travelling dot along hero route, subtle, after draw */
  var routePath = $('.hero-route-path'), dot = $('.hero-route-dot');
  if (routePath && dot && routePath.getTotalLength) {
    var len = routePath.getTotalLength();
    setTimeout(function () {
      animate(dot, { opacity: [0, 0.9] }, { duration: 0.6 });
      animate(0, 1, {
        duration: 9, repeat: Infinity, ease: 'linear',
        onUpdate: function (v) {
          var pt = routePath.getPointAtLength(v * len);
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        }
      });
    }, 3200);
  }

  /* Hero parallax on scroll */
  if (!small) {
    scroll(animate('.hero-media img', { y: ['0%', '12%'] }, { ease: 'linear' }), { target: $('.hero'), offset: ['start start', 'end start'] });
    scroll(animate('.hero-inner', { y: [0, -60], opacity: [1, 0.2] }, { ease: 'linear' }), { target: $('.hero'), offset: ['start start', 'end start'] });
  }

  /* Generic reveals */
  inView('[data-reveal]', function (el) {
    animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: EASE });
  }, { margin: '0px 0px -12% 0px' });

  inView('[data-stagger]', function (el) {
    animate(Array.prototype.slice.call(el.children), { opacity: [0, 1], y: [22, 0] }, { duration: 0.7, delay: stagger(0.07), ease: EASE });
  }, { margin: '0px 0px -12% 0px' });

  inView('[data-reveal-img]', function (el) {
    animate(el, { clipPath: ['inset(100% 0% 0% 0% round 22px)', 'inset(0% 0% 0% 0% round 22px)'] }, { duration: 1.2, ease: EASE });
    var img = el.querySelector('img');
    if (img) animate(img, { scale: [1.2, 1] }, { duration: 1.6, ease: EASE });
  }, { margin: '0px 0px -10% 0px' });

  /* Built around what matters */
  inView('.matters-words', function (el) {
    animate($$('span', el), { y: ['105%', '0%'] }, { duration: 0.9, delay: stagger(0.12), ease: EASE });
  }, { margin: '0px 0px -15% 0px' });

  /* Map draw */
  if (chart) {
    var sites = $$('.site', chart);
    sites.forEach(function (s) { s.setAttribute('opacity', '0'); });
    $('.route', chart).setAttribute('stroke-dashoffset', '1');
    inView('.network-map', function () { 
      animate($('.route', chart), { strokeDashoffset: [1, 0] }, { duration: 2, ease: [0.65, 0, 0.35, 1] });
      animate(sites, { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.35, { startDelay: 0.5 }) });
    }, { margin: '0px 0px -20% 0px' });
  }

  /* Contact route */
  var cr = $('.contact-route .cr-path'); if (cr) cr.setAttribute('stroke-dashoffset', '1');
  inView('.contact-route', function (el) {
    animate(el.querySelector('.cr-path'), { strokeDashoffset: [1, 0] }, { duration: 1.8, ease: EASE });
  });

  /* Parallax images */
  if (!small) {
    $$('[data-parallax]').forEach(function (el) {
      var img = el.querySelector('img');
      if (img) scroll(animate(img, { y: ['-6%', '6%'] }, { ease: 'linear' }), { target: el, offset: ['start end', 'end start'] });
    });
    $$('[data-parallax-bg]').forEach(function (el) {
      var img = el.querySelector('img');
      if (img) scroll(animate(img, { y: ['-8%', '8%'] }, { ease: 'linear' }), { target: el.parentElement, offset: ['start end', 'end start'] });
    });
  }

  /* ======================================================= */
  function initForm() {
    var form = $('#enquiry-form');
    if (!form) return;
    var status = $('#form-status');
    var submit = $('#f-submit');
    var label = submit.querySelector('.btn-label');

    var checks = [
      { el: form.elements.name, msg: 'Enter your name.' },
      { el: form.elements.email, msg: 'Enter a valid email address, like name@company.com.' },
      { el: form.elements.message, msg: 'Tell us briefly what you need.' }
    ];

    function validate() {
      var firstBad = null;
      checks.forEach(function (c) {
        var ok = c.el.value.trim() !== '' && c.el.checkValidity();
        var err = document.getElementById(c.el.id + '-err');
        c.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (err) err.textContent = ok ? '' : c.msg;
        if (ok) c.el.removeAttribute('aria-describedby'); else c.el.setAttribute('aria-describedby', c.el.id + '-err');
        if (!ok && !firstBad) firstBad = c.el;
      });
      return firstBad;
    }
    checks.forEach(function (c) {
      c.el.addEventListener('blur', function () { if (c.el.getAttribute('aria-invalid') === 'true') validate(); });
    });

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'f-status' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      var bad = validate();
      if (bad) { bad.focus(); return; }

      if (form.elements.access_key.value.indexOf('YOUR_') === 0) {
        setStatus('The form is not connected yet. Add the Web3Forms access key in index.html.', 'error');
        return;
      }

      var data = new FormData(form);
      var services = data.getAll('services[]');
      data.delete('services[]');
      data.append('services', services.length ? services.join(', ') : 'Not specified');

      submit.disabled = true;
      label.textContent = 'Sending…';

      fetch(form.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (r) {
          if (!r.ok || !r.json.success) throw new Error(r.json.message || 'Request failed');
          var first = form.elements.name.value.trim().split(' ')[0] || '';
          var email = form.elements.email.value.trim();
          var panel = document.createElement('div');
          panel.className = 'sent-panel';
          panel.setAttribute('tabindex', '-1');
          panel.innerHTML = '<div class="sent-icon" aria-hidden="true"></div><h3></h3><p>Our team will reply to <strong></strong>.</p>';
          panel.querySelector('h3').textContent = 'Enquiry sent' + (first ? ', thank you ' + first : '') + '.';
          panel.querySelector('strong').textContent = email;
          form.appendChild(panel);
          form.classList.add('sent');
          form.reset();
          panel.focus();
          if (canAnimate) M.animate(panel, { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, ease: EASE });
        })
        .catch(function () {
          setStatus('Your enquiry could not be sent. Check your connection and try again.', 'error');
        })
        .finally(function () {
          submit.disabled = false;
          label.textContent = 'Send enquiry';
        });
    });
  }
})();
