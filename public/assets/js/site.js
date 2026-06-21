'use strict';

// ─── 1. Remove is-preload after load ─────────────────────────────────────────
window.addEventListener('load', function () {
  setTimeout(function () {
    document.body.classList.remove('is-preload');
  }, 100);
});

// ─── 2. Parallax background ──────────────────────────────────────────────────
(function () {
  var wrapper = document.getElementById('wrapper');
  if (!wrapper) return;

  // Inject .bg as first child of #wrapper
  var bg = document.createElement('div');
  bg.className = 'bg';
  wrapper.insertBefore(bg, wrapper.firstChild);

  var mqLarge = window.matchMedia('(max-width: 1280px)');
  var scrollBound = false;

  function onScroll() {
    bg.style.transform = 'matrix(1,0,0,1,0,' + (window.scrollY * 0.925) + ')';
  }

  function update() {
    var useFixed = window.devicePixelRatio > 1 || mqLarge.matches;
    if (useFixed) {
      bg.classList.add('fixed');
      bg.style.transform = 'none';
      if (scrollBound) {
        window.removeEventListener('scroll', onScroll);
        scrollBound = false;
      }
    } else {
      bg.classList.remove('fixed');
      if (!scrollBound) {
        window.addEventListener('scroll', onScroll, { passive: true });
        scrollBound = true;
      }
      onScroll();
    }
  }

  if (mqLarge.addEventListener) {
    mqLarge.addEventListener('change', update);
  } else {
    mqLarge.addListener(update); // Safari <14 fallback
  }

  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('load', update);
  update();
})();

// ─── 3. Mobile nav panel ─────────────────────────────────────────────────────
(function () {
  var wrapper = document.getElementById('wrapper');
  var nav = document.getElementById('nav');
  var header = document.getElementById('header');
  if (!wrapper || !nav) return;

  // Inject toggle button into #wrapper
  var toggle = document.createElement('a');
  toggle.id = 'navPanelToggle';
  toggle.textContent = 'Menu';
  toggle.href = '#';
  wrapper.appendChild(toggle);

  // Toggle .alt when #header leaves the viewport
  if (header && window.IntersectionObserver) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        toggle.classList.toggle('alt', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    obs.observe(header);
  }

  // Inject #navPanel into <body>
  var panel = document.createElement('div');
  panel.id = 'navPanel';

  // Clone nav links into panel
  var linksUl = nav.querySelector('ul.links');
  if (linksUl) {
    panel.appendChild(linksUl.cloneNode(true));
  }

  // Close button
  var closeBtn = document.createElement('a');
  closeBtn.className = 'close';
  closeBtn.href = '#';
  panel.appendChild(closeBtn);

  document.body.appendChild(panel);

  // ── Open / close helpers ───────────────────────────────────────────────────
  function openPanel() {
    document.body.classList.add('is-navPanel-visible');
  }

  function closePanel() {
    document.body.classList.remove('is-navPanel-visible');
  }

  function isVisible() {
    return document.body.classList.contains('is-navPanel-visible');
  }

  // Toggle button click
  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (isVisible()) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // Close button click
  closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    closePanel();
  });

  // Close when any link inside panel is clicked (navigation / anchors)
  panel.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link && link !== closeBtn) {
      closePanel();
    }
  });

  // ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isVisible()) {
      closePanel();
    }
  });

  // Click outside panel
  document.addEventListener('click', function (e) {
    if (isVisible() && !panel.contains(e.target)) {
      closePanel();
    }
  });

  // Right swipe to dismiss
  var touchStartX = 0;
  panel.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  panel.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 50) {
      closePanel();
    }
  }, { passive: true });

  // Force close when viewport grows past mobile breakpoint
  var mqDesktop = window.matchMedia('(min-width: 981px)');
  var mqDesktopHandler = function (mq) {
    if (mq.matches) closePanel();
  };
  if (mqDesktop.addEventListener) {
    mqDesktop.addEventListener('change', mqDesktopHandler);
  } else {
    mqDesktop.addListener(mqDesktopHandler);
  }
})();

// ─── 4. Smooth scroll for anchor links ───────────────────────────────────────
document.addEventListener('click', function (e) {
  var link = e.target.closest('a[href^="#"]');
  if (!link) return;
  var href = link.getAttribute('href');
  if (href === '#' || href === '#navPanel') return;
  var target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
