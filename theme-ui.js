(function () {
    'use strict';

    var STORAGE_THEME = 'theme';
    var DEFAULT_THEME = 'dark';

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function updateToggleAccessibility(theme) {
        var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        ['theme-toggle', 'theme-toggle-mobile'].forEach(function (id) {
            var btn = document.getElementById(id);
            if (btn) {
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            }
        });
    }

    function syncThemeFromStorage() {
        var html = document.documentElement;
        var saved;
        try {
            saved = localStorage.getItem(STORAGE_THEME);
        } catch (e) {
            saved = null;
        }
        var theme = saved || DEFAULT_THEME;
        html.setAttribute('data-theme', theme);
        updateToggleAccessibility(theme);
    }

    function applyThemeToDOM(newTheme) {
        var html = document.documentElement;
        html.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem(STORAGE_THEME, newTheme);
        } catch (e) {}
        updateToggleAccessibility(newTheme);
    }

    function toggleTheme() {
        var html = document.documentElement;
        var current = html.getAttribute('data-theme') || DEFAULT_THEME;
        var newTheme = current === 'dark' ? 'light' : 'dark';

        function apply() {
            applyThemeToDOM(newTheme);
        }

        if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
            apply();
            return;
        }

        document.startViewTransition(function () {
            apply();
        });
    }

    function bindThemeToggles() {
        ['theme-toggle', 'theme-toggle-mobile'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', toggleTheme);
        });
    }

    function getOrCreateMenuBackdrop() {
        var el = document.getElementById('mobile-nav-backdrop');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'mobile-nav-backdrop';
        el.className = 'mobile-nav-backdrop';
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
        return el;
    }

    function closeMobileMenu(sidebar, toggle, backdrop) {
        if (sidebar) sidebar.classList.remove('is-menu-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = 'Menu';
        }
        document.body.style.overflow = '';
        if (backdrop) {
            backdrop.classList.remove('is-visible');
            backdrop.setAttribute('aria-hidden', 'true');
        }
    }

    function openMobileMenu(sidebar, toggle, backdrop) {
        if (sidebar) sidebar.classList.add('is-menu-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.textContent = 'Close';
        }
        document.body.style.overflow = 'hidden';
        if (backdrop) {
            backdrop.classList.add('is-visible');
            backdrop.setAttribute('aria-hidden', 'false');
        }
    }

    function initMenu() {
        var toggle = document.getElementById('menu-toggle');
        var sidebar = document.querySelector('.sidebar');
        if (!toggle || !sidebar) return;

        var backdrop = getOrCreateMenuBackdrop();

        backdrop.addEventListener('click', function () {
            closeMobileMenu(sidebar, toggle, backdrop);
        });

        toggle.addEventListener('click', function () {
            var open = sidebar.classList.contains('is-menu-open');
            if (open) {
                closeMobileMenu(sidebar, toggle, backdrop);
            } else {
                openMobileMenu(sidebar, toggle, backdrop);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (!sidebar.classList.contains('is-menu-open')) return;
            closeMobileMenu(sidebar, toggle, backdrop);
            toggle.focus();
        });
    }

    function initSkipLink() {
        var skip = document.querySelector('.skip-link');
        var mainEl = document.getElementById('main-content');
        if (!skip || !mainEl) return;
        skip.addEventListener('click', function () {
            window.requestAnimationFrame(function () {
                mainEl.focus();
            });
        });
    }

    syncThemeFromStorage();
    bindThemeToggles();
    initMenu();
    initSkipLink();
})();
