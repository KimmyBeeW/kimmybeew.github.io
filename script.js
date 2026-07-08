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

  // Navigate to a tab by updating the URL hash. Writing the hash makes the
  // tab shareable/bookmarkable and creates a history entry, so the browser
  // Back button steps between tabs. The hashchange handler does the DOM work.
  function goToTab(name) {
    var target = resolveTab(name) || 'data';
    if (('#' + target) === window.location.hash) {
      applyTab(target);              // same hash -> no hashchange fires, apply directly
    } else {
      window.location.hash = target; // triggers the hashchange handler below
    }
  }

  // React to hash changes: tab-button clicks, shared links, and Back/Forward.
  window.addEventListener('hashchange', function () {
    var name = tabFromHash();
    if (name) applyTab(name);
  });

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

  /* -------- 5. Footer year -------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
