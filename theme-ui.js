(function () {
    'use strict';

    var STORAGE_THEME = 'theme';
    var DEFAULT_THEME = 'dark';

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

    function toggleTheme() {
        var html = document.documentElement;
        var current = html.getAttribute('data-theme') || DEFAULT_THEME;
        var newTheme = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem(STORAGE_THEME, newTheme);
        } catch (e) {}
        updateToggleAccessibility(newTheme);
    }

    function bindThemeToggles() {
        ['theme-toggle', 'theme-toggle-mobile'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', toggleTheme);
        });
    }

    function initMenu() {
        var toggle = document.getElementById('menu-toggle');
        var sidebar = document.querySelector('.sidebar');
        if (!toggle || !sidebar) return;
        toggle.addEventListener('click', function () {
            var open = sidebar.classList.toggle('is-menu-open');
            toggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
        });
    }

    syncThemeFromStorage();
    bindThemeToggles();
    initMenu();
})();
