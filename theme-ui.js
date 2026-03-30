(function () {
    'use strict';

    var STORAGE_THEME = 'theme';
    var DEFAULT_THEME = 'dark';
    var MOBILE_NAV_MQ = '(max-width: 720px)';

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

    var mediaCardFlowResizeObserver = null;
    var mediaCardFlowResizeTimer = null;
    var mediaCardLayoutLock = false;
    var mediaCardFirstRevealDone = false;

    function parseMediaCardDateMs(li) {
        var t = li.querySelector('time[datetime]');
        if (!t) return 0;
        var s = t.getAttribute('datetime') || '';
        var ms = Date.parse(s);
        return isNaN(ms) ? 0 : ms;
    }

    /** Newest first; tie-break by title. */
    function reorderMediaCardsByDate(flow) {
        var items = [].slice.call(flow.querySelectorAll('.media-card-flow__item'));
        if (items.length < 2) return;

        items.sort(function (a, b) {
            var db = parseMediaCardDateMs(b) - parseMediaCardDateMs(a);
            if (db !== 0) return db;
            var ta = a.querySelector('.media-card__title');
            var tb = b.querySelector('.media-card__title');
            return (ta && ta.textContent || '').localeCompare(tb && tb.textContent || '');
        });

        // Skip DOM manipulation if the order is already correct.
        // Detaching/reattaching elements resets running CSS animations.
        var domOrder = flow.querySelectorAll('.media-card-flow__item');
        var needsReorder = false;
        for (var k = 0; k < items.length; k++) {
            if (items[k] !== domOrder[k]) {
                needsReorder = true;
                break;
            }
        }
        if (!needsReorder) return;

        var frag = document.createDocumentFragment();
        items.forEach(function (li) {
            frag.appendChild(li);
        });
        flow.appendChild(frag);
    }

    function remToPx(rem) {
        var base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return rem * base;
    }

    /**
     * Seeded greedy masonry: first C items seed one card per column, then each remaining item
     * goes to the currently shortest column (lowest accumulated height; ties keep lower index).
     */
    function layoutMediaCards(flow) {
        reorderMediaCardsByDate(flow);
        var items = [].slice.call(flow.querySelectorAll('.media-card-flow__item'));
        if (!items.length) {
            flow.style.height = '';
            flow.classList.remove('media-card-flow--js-layout');
            return 'empty';
        }

        var colMin = remToPx(11.25);
        var gap = remToPx(1);
        var innerW = flow.clientWidth;
        if (innerW < 2) {
            var retries = (flow._mediaLayoutRetries || 0) + 1;
            flow._mediaLayoutRetries = retries;
            if (retries < 10) {
                requestAnimationFrame(function () {
                    if (flow.isConnected) layoutMediaCards(flow);
                });
            }
            return 'pending';
        }
        flow._mediaLayoutRetries = 0;
        var C = Math.max(1, Math.floor((innerW + gap) / (colMin + gap)));
        var colW = (innerW - (C - 1) * gap) / C;

        var hadJsLayout = flow.classList.contains('media-card-flow--js-layout');
        items.forEach(function (li) {
            if (!hadJsLayout) {
                li.style.position = '';
                li.style.left = '';
                li.style.top = '';
            }
            li.style.width = colW + 'px';
        });
        if (!hadJsLayout) {
            flow.style.height = 'auto';
        }

        var heights = items.map(function (li) {
            return li.offsetHeight;
        });

        flow.classList.add('media-card-flow--js-layout');
        var colHeights = [];
        var c;
        for (c = 0; c < C; c++) {
            colHeights[c] = 0;
        }

        items.forEach(function (li, i) {
            if (i < C) {
                c = i;
            } else {
                c = 0;
                for (var k = 1; k < C; k++) {
                    if (colHeights[k] < colHeights[c]) {
                        c = k;
                    }
                }
            }
            var h = heights[i];
            var top = colHeights[c];
            li.style.position = 'absolute';
            li.style.left = (c * (colW + gap)) + 'px';
            li.style.top = top + 'px';
            li.style.width = colW + 'px';
            colHeights[c] = top + h + gap;
        });

        var maxH = 0;
        for (c = 0; c < C; c++) {
            if (colHeights[c] > maxH) {
                maxH = colHeights[c];
            }
        }
        var finalHeight = Math.max(0, maxH - gap);
        flow.style.height = finalHeight + 'px';
        return [innerW, C, Math.round(colW * 1000), Math.round(finalHeight)].join(':');
    }

    function withMediaCardLayoutLock(fn) {
        if (mediaCardLayoutLock) return null;
        mediaCardLayoutLock = true;
        try {
            return fn();
        } finally {
            mediaCardLayoutLock = false;
        }
    }

    function runMediaCardLayout(flow) {
        return withMediaCardLayoutLock(function () {
            return layoutMediaCards(flow);
        });
    }

    function setMediaCardIndices(flow) {
        var arr = [].slice.call(flow.querySelectorAll('.media-card-flow__item'));
        arr.forEach(function (li, idx) {
            li.style.setProperty('--media-card-i', String(idx));
        });
    }

    function setMediaCardReady(flow) {
        flow.classList.add('media-card-flow--ready');
        flow.classList.remove('media-card-flow--booting');
    }

    function attachMediaCardFlowResize(flow) {
        if (!window.ResizeObserver) return;
        if (mediaCardFlowResizeObserver) {
            mediaCardFlowResizeObserver.disconnect();
        }
        mediaCardFlowResizeObserver = new ResizeObserver(function () {
            clearTimeout(mediaCardFlowResizeTimer);
            mediaCardFlowResizeTimer = setTimeout(function () {
                if (!flow.isConnected) return;
                runMediaCardLayout(flow);
            }, 100);
        });
        mediaCardFlowResizeObserver.observe(flow);
    }

    function disconnectMediaCardFlowResize() {
        if (mediaCardFlowResizeObserver) {
            mediaCardFlowResizeObserver.disconnect();
            mediaCardFlowResizeObserver = null;
        }
        clearTimeout(mediaCardFlowResizeTimer);
    }

    function staggerMediaCardsReadingOrder() {
        var flow = document.querySelector('.media-card-flow');
        if (!flow) {
            disconnectMediaCardFlowResize();
            return;
        }

        requestAnimationFrame(function () {
            var firstReveal = !mediaCardFirstRevealDone;
            if (firstReveal) {
                flow.classList.add('media-card-flow--booting');
                flow.classList.remove('media-card-flow--ready');
                flow.classList.remove('media-card-flow--stagger-done');
            } else {
                flow.classList.add('media-card-flow--ready');
                flow.classList.remove('media-card-flow--booting');
            }

            var clearEls = flow.querySelectorAll('.media-card-flow__item');
            for (var j = 0; j < clearEls.length; j++) {
                clearEls[j].style.removeProperty('--media-card-i');
            }

            var initialSignature = runMediaCardLayout(flow);

            function finalizeReveal() {
                if (!flow.isConnected) return;
                if (prefersReducedMotion()) {
                    flow.classList.add('media-card-flow--stagger-done');
                    setMediaCardReady(flow);
                    mediaCardFirstRevealDone = true;
                    attachMediaCardFlowResize(flow);
                    return;
                }

                if (!firstReveal) {
                    setMediaCardIndices(flow);
                    flow.classList.add('media-card-flow--stagger-done');
                    mediaCardFirstRevealDone = true;
                    attachMediaCardFlowResize(flow);
                    return;
                }
                setMediaCardIndices(flow);
                flow.classList.add('media-card-flow--stagger-done');
                setMediaCardReady(flow);
                mediaCardFirstRevealDone = true;
                // Defer resize observer until stagger animations are done,
                // so the initial observation cannot interfere with the reveal.
                setTimeout(function () {
                    if (flow.isConnected) attachMediaCardFlowResize(flow);
                }, 1000);
            }

            if (firstReveal &&
                document.fonts &&
                document.fonts.ready &&
                document.fonts.status !== 'loaded') {
                document.fonts.ready.then(function () {
                    if (!flow.isConnected) return;
                    var nextSig = runMediaCardLayout(flow);
                    if (!nextSig || nextSig === 'pending' || nextSig !== initialSignature) {
                        // Fonts changed metrics; keep the latest geometry before reveal.
                    }
                    finalizeReveal();
                }).catch(function () {
                    finalizeReveal();
                });
                return;
            }

            finalizeReveal();
        });
    }

    function onTurboLoad() {
        closeMobileMenu();
        syncNavActive();
        staggerMediaCardsReadingOrder();
    }

    function onMobileNavBreakpointChange() {
        closeMobileMenu();
    }

    function bindMobileNavBreakpointListener() {
        if (!window.matchMedia) return;
        var mq = window.matchMedia(MOBILE_NAV_MQ);
        mq.addEventListener('change', onMobileNavBreakpointChange);
    }

    syncThemeFromStorage();
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    document.addEventListener('turbo:load', onTurboLoad);
    bindMobileNavBreakpointListener();
    syncNavActive();
})();
