/* ==================================================================== */
/* =============================  SCRIPTS  ============================= */
/* ==================================================================== */
(function () {
  'use strict';

  /* -------- 1. THEME TOGGLE (with in-page persistence) -------- */
  // NOTE: localStorage is avoided here so the file works from file://
  //       and inside sandboxed previews. Swap in localStorage if you
  //       want the choice to persist across visits on GitHub Pages.
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  // Respect the visitor's OS preference on first load.
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
  });

  /* -------- 2. TAB SWITCHING (show/hide panels, no reload) -------- */
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var panels = {
    data:      document.getElementById('tab-data'),
    web:       document.getElementById('tab-web'),
    exp:       document.getElementById('tab-exp'),
    creative:  document.getElementById('tab-creative'),
    community: document.getElementById('tab-community')
  };

  function activateTab(name) {
    // Update buttons
    tabButtons.forEach(function (btn) {
      var isActive = btn.getAttribute('data-tab') === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // Update panels
    Object.keys(panels).forEach(function (key) {
      if (panels[key]) panels[key].classList.toggle('active', key === name);
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.getAttribute('data-tab'));
    });
  });

  /* -------- 3. HERO CTA -> jump to a tab -------- */
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () {
      activateTab(el.getAttribute('data-goto'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* -------- 4. Footer year -------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
