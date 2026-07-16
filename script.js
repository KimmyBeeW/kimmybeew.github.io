/* ==================================================================== */
/* =============================  SCRIPTS  ============================= */
/* ==================================================================== */
(function () {
  'use strict';

  // Keys used for remembering choices between visits.
  var STORAGE_THEME = 'kw-portfolio-theme';
  var STORAGE_TAB   = 'kw-portfolio-tab';

  // Small wrappers so a blocked/unavailable localStorage (private mode,
  // file://, sandboxed preview) never throws and breaks the page.
  function storeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  var root = document.documentElement;

  /* -------- 1. THEME TOGGLE (remembered across visits) -------- */
  // NOTE: the *initial* theme is applied by a tiny inline bootstrap in
  //       <head> (so there's no light/dark flash on load). Here we only
  //       handle toggling and saving the choice.
  var toggle = document.getElementById('themeToggle');

  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    storeSet(STORAGE_THEME, next);
  });

  /* -------- 2. TAB SWITCHING (remembered + shareable via URL hash) -------- */
  var TABS = ['data', 'web', 'exp', 'creative', 'community'];

  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var panels = {
    data:      document.getElementById('tab-data'),
    web:       document.getElementById('tab-web'),
    exp:       document.getElementById('tab-exp'),
    creative:  document.getElementById('tab-creative'),
    community: document.getElementById('tab-community')
  };

  // Returns a valid tab name or null (so unrelated hashes like #contact
  // or a placeholder "#" link are ignored rather than breaking things).
  function resolveTab(name) {
    return TABS.indexOf(name) !== -1 ? name : null;
  }

  function tabFromHash() {
    return resolveTab((window.location.hash || '').replace('#', ''));
  }

  // Update the DOM + remember the choice. Assumes `name` is already valid.
  function applyTab(name) {
    tabButtons.forEach(function (btn) {
      var isActive = btn.getAttribute('data-tab') === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    Object.keys(panels).forEach(function (key) {
      if (panels[key]) panels[key].classList.toggle('active', key === name);
    });
    storeSet(STORAGE_TAB, name);
  }

  // Both snap instantly (behavior:'instant' overrides the page's smooth
  // scroll-behavior) rather than animating a long scroll from the bottom.

  // Very top of the page — used when clicking the brand/logo.
  function scrollToPageTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  // Top of the panel content, tucked just under the sticky header — used when
  // switching tabs, so the hero scrolls away and the section starts at the top.
  function scrollToPanelTop() {
    var header = document.querySelector('.site-header');
    var main = document.querySelector('main');
    if (!main) { scrollToPageTop(); return; }
    var headerH = header ? header.offsetHeight : 0;
    var y = main.getBoundingClientRect().top + window.pageYOffset - headerH;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'instant' });
  }

  // Navigate to a tab by updating the URL hash. Writing the hash makes the
  // tab shareable/bookmarkable and creates a history entry, so the browser
  // Back button steps between tabs. The hashchange handler does the DOM work.
  function goToTab(name) {
    var target = resolveTab(name) || 'data';
    if (('#' + target) === window.location.hash) {
      applyTab(target);              // same hash -> no hashchange fires, apply directly
      scrollToPanelTop();
    } else {
      window.location.hash = target; // triggers the hashchange handler below
    }
  }

  // React to hash changes: tab-button clicks, shared links, and Back/Forward.
  window.addEventListener('hashchange', function () {
    var name = tabFromHash();
    if (name) { applyTab(name); scrollToPanelTop(); }
  });

  // Clicking the brand (dot or name) scrolls to the very top, keeping the tab.
  var brand = document.querySelector('.nav-brand');
  if (brand) brand.addEventListener('click', scrollToPageTop);

  // Tab buttons drive navigation through the hash.
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToTab(btn.getAttribute('data-tab'));
    });
  });

  /* -------- 3. Any [data-goto] element (e.g. hero CTA) -> jump to a tab -------- */
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () {
      goToTab(el.getAttribute('data-goto'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* -------- 4. Decide which tab to show on first load -------- */
  // Priority: a valid URL hash (shared link) > last-remembered tab > default.
  var initialTab = tabFromHash() || resolveTab(storeGet(STORAGE_TAB)) || 'data';
  applyTab(initialTab);
  // Reflect the resolved tab in the URL without adding a history entry, so a
  // plain refresh keeps the address bar in sync and the link stays copyable.
  if (tabFromHash() !== initialTab) {
    try { history.replaceState(null, '', '#' + initialTab); } catch (e) {}
  }

  /* -------- 5. Data Science & Website cards: click the whole card -> its first link -------- */
  // Each card's first .card-links anchor is the "primary" one (the Analysis for
  // data projects, the Live site/app for websites). A click anywhere on the card
  // opens it, but clicks on an actual link (or a text selection) fall through so
  // any other links still work.
  document.querySelectorAll('#tab-data .card, #tab-web .card').forEach(function (card) {
    var primary = card.querySelector('.card-links a');
    if (!primary) return;

    card.addEventListener('click', function (e) {
      // Ignore clicks that landed on any real link inside the card.
      if (e.target.closest('a')) return;
      // Ignore if the user was selecting text rather than clicking.
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString().length) return;

      // Open the primary link, honoring its target (new tab vs same tab).
      if (primary.target === '_blank') {
        window.open(primary.href, '_blank', 'noopener');
      } else {
        window.location.href = primary.href;
      }
    });
  });

  /* -------- 6. Lightbox: view gallery images in-page (no navigation) -------- */
  // Each .gallery becomes its own set the arrows cycle through. Clicking a
  // thumbnail opens the shared overlay instead of following the link; the
  // <a href> stays as a no-JS fallback.
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg     = lb.querySelector('.lb-img');
    var lbCaption = lb.querySelector('.lb-caption');
    var lbCount   = lb.querySelector('.lb-count');
    var btnClose  = lb.querySelector('.lb-close');
    var btnPrev   = lb.querySelector('.lb-prev');
    var btnNext   = lb.querySelector('.lb-next');

    var items = [];   // current gallery: [{ src, alt, caption }]
    var index = 0;
    var lastFocus = null;

    function render() {
      var it = items[index];
      if (!it) return;
      lbImg.src = it.src;
      lbImg.alt = it.alt || '';
      lbCaption.textContent = it.caption || '';
      lbCount.textContent = items.length > 1 ? (index + 1) + ' / ' + items.length : '';
    }

    function openAt(list, i) {
      items = list;
      index = i;
      var single = items.length <= 1;
      btnPrev.hidden = single;
      btnNext.hidden = single;
      render();
      lb.hidden = false;
      document.body.style.overflow = 'hidden';   // stop the page scrolling behind
      lastFocus = document.activeElement;
      btnClose.focus();
    }

    function close() {
      lb.hidden = true;
      lbImg.src = '';
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(dir) {
      if (items.length < 2) return;
      index = (index + dir + items.length) % items.length;
      render();
    }

    // Wire every gallery on the page.
    document.querySelectorAll('.gallery').forEach(function (gallery) {
      var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
      var list = links.map(function (a) {
        var img = a.querySelector('img');
        var cap = a.querySelector('figcaption');
        return {
          src: a.getAttribute('href'),
          alt: img ? img.alt : '',
          caption: cap ? cap.textContent : (img ? img.alt : '')
        };
      });
      links.forEach(function (a, i) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          openAt(list, i);
        });
      });
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { step(-1); });
    btnNext.addEventListener('click', function () { step(1); });
    // Click the darkened backdrop (but not the image or buttons) to close.
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    // Keyboard: Esc closes, arrows navigate.
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    // Touch: horizontal swipe navigates, a quick tap on the backdrop closes.
    var touchX = 0, touchY = 0, touchTime = 0;
    lb.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      touchX = t.clientX; touchY = t.clientY; touchTime = e.timeStamp;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0];
      var dx = t.clientX - touchX;
      var dy = t.clientY - touchY;
      // Mostly-horizontal, far enough, and quick enough to count as a swipe.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        step(dx < 0 ? 1 : -1);   // swipe left -> next, swipe right -> prev
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && (e.timeStamp - touchTime) < 300
                 && e.target === lb) {
        close();                 // a tap on the backdrop (not the image) closes
      }
    }, { passive: true });
  }

  /* -------- 7. Footer year -------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
