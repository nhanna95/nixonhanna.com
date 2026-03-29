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

    function applyColorScheme(theme) {
        document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
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
        applyColorScheme(theme);
        updateToggleAccessibility(theme);
    }

    function applyThemeToDOM(newTheme) {
        var html = document.documentElement;
        html.setAttribute('data-theme', newTheme);
        applyColorScheme(newTheme);
        try {
            localStorage.setItem(STORAGE_THEME, newTheme);
        } catch (e) { }
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

    function sidebarEl() {
        return document.getElementById('site-sidebar') || document.querySelector('.sidebar');
    }

    function closeMobileMenu() {
        var sidebar = sidebarEl();
        var toggle = document.getElementById('menu-toggle');
        var backdrop = document.getElementById('mobile-nav-backdrop');
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

    function openMobileMenu() {
        var sidebar = sidebarEl();
        var toggle = document.getElementById('menu-toggle');
        var backdrop = document.getElementById('mobile-nav-backdrop');
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

    function onDocumentClick(e) {
        var t = e.target;
        if (t.closest && (t.closest('#theme-toggle') || t.closest('#theme-toggle-mobile'))) {
            toggleTheme();
            return;
        }
        var skip = t.closest && t.closest('.skip-link');
        if (skip && skip.getAttribute('href') === '#main-content') {
            var mainEl = document.getElementById('main-content');
            if (mainEl) {
                window.requestAnimationFrame(function () {
                    mainEl.focus();
                });
            }
            return;
        }
        if (t.id === 'mobile-nav-backdrop' || (t.closest && t.closest('#mobile-nav-backdrop'))) {
            closeMobileMenu();
            return;
        }
        if (t.closest && t.closest('#menu-toggle')) {
            var sidebar = sidebarEl();
            if (!sidebar) return;
            var open = sidebar.classList.contains('is-menu-open');
            if (open) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }
    }

    function onDocumentKeydown(e) {
        if (e.key !== 'Escape') return;
        var sidebar = sidebarEl();
        var toggle = document.getElementById('menu-toggle');
        if (!sidebar || !sidebar.classList.contains('is-menu-open')) return;
        closeMobileMenu();
        if (toggle) toggle.focus();
    }

    function normalizePath(pathname) {
        if (!pathname) return '/';
        var p = pathname;
        if (p.length > 1 && p.endsWith('/')) {
            p = p.slice(0, -1);
        }
        if (p.endsWith('/index.html')) {
            p = p.slice(0, -10) || '/';
        }
        return p;
    }

    function syncNavActive() {
        var navLinks = document.querySelectorAll('#site-nav > a');
        if (!navLinks.length) return;
        var cur = normalizePath(window.location.pathname);
        navLinks.forEach(function (a) {
            var href = a.getAttribute('href');
            if (!href || href.indexOf('http') === 0) return;
            var linkPath = normalizePath(new URL(href, window.location.origin).pathname);
            a.classList.toggle('is-active', linkPath === cur);
        });
    }

    function onTurboLoad() {
        closeMobileMenu();
        syncNavActive();
    }

    syncThemeFromStorage();
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    document.addEventListener('turbo:load', onTurboLoad);
    syncNavActive();
})();
