(function () {
    'use strict';

    // Home-page still: each click shows the next photo and switches the page theme to match it.
    function preload(src) {
        var i = new Image();
        i.src = src;
    }

    function cycleStill(btn) {
        var stills = JSON.parse(btn.getAttribute('data-stills'));
        var next = (parseInt(btn.getAttribute('data-index') || '0', 10) + 1) % stills.length;
        var img = btn.querySelector('img');
        var still = stills[next];
        img.src = still.src;
        img.alt = still.alt;
        if (still.film) btn.setAttribute('data-film', still.film);
        else btn.removeAttribute('data-film');
        placeFilm(btn, null);
        btn.setAttribute('data-index', String(next));
        if (next === 0) {
            document.documentElement.removeAttribute('data-still');
        } else {
            document.documentElement.setAttribute('data-still', still.key);
        }
        try {
            if (next === 0) sessionStorage.removeItem('still');
            else sessionStorage.setItem('still', still.key);
        } catch (e) { }
        preload(stills[(next + 1) % stills.length].src);
    }

    // Film credit that follows the cursor over the still. Mouse only: on a phone a tap would pop it
    // up and leave it stuck, since the "pointer" never leaves (styles.css also hides it without hover).
    var canHover = window.matchMedia('(hover: hover)');

    function placeFilm(btn, e) {
        var label = btn.querySelector('.still-film');
        if (!label) return;
        var film = btn.getAttribute('data-film');
        if (!film || !canHover.matches || (!e && !btn.matches(':hover'))) {
            label.classList.remove('is-on');
            return;
        }
        label.textContent = film;
        if (e) {
            var r = btn.getBoundingClientRect();
            var x = e.clientX - r.left + 14;
            var y = e.clientY - r.top + 18;
            // keep it inside the frame
            x = Math.min(x, r.width - label.offsetWidth - 6);
            y = Math.min(y, r.height - label.offsetHeight - 6);
            label.style.left = x + 'px';
            label.style.top = y + 'px';
        }
        label.classList.add('is-on');
    }

    document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var btn = e.target.closest && e.target.closest('.still-cycle');
        if (btn) placeFilm(btn, e);
    });

    document.addEventListener('mouseout', function (e) {
        var btn = e.target.closest && e.target.closest('.still-cycle');
        if (btn && !btn.contains(e.relatedTarget)) {
            var label = btn.querySelector('.still-film');
            if (label) label.classList.remove('is-on');
        }
    });

    document.addEventListener('click', function (e) {
        var t = e.target;

        var stillBtn = t.closest && t.closest('.still-cycle');
        if (stillBtn) {
            cycleStill(stillBtn);
            return;
        }

        // Click-to-copy text (email addresses on the contact page).
        var copy = t.closest && t.closest('.copy-text');
        if (copy) {
            var value = copy.getAttribute('data-copy');
            var done = copy.querySelector('.copy-text-done');
            var show = function (msg) {
                if (!done) return;
                done.textContent = msg;
                copy.classList.add('is-copied');
                setTimeout(function () { copy.classList.remove('is-copied'); done.textContent = ''; }, 1500);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).then(function () { show('Copied!'); }, function () {
                    window.location.href = 'mailto:' + value;
                });
            } else {
                window.location.href = 'mailto:' + value;
            }
            return;
        }

        // Skip link: move focus into the main region after the jump.
        var skip = t.closest && t.closest('.skip-link');
        if (skip && skip.getAttribute('href') === '#main-content') {
            var mainEl = document.getElementById('main-content');
            if (mainEl) {
                window.requestAnimationFrame(function () {
                    mainEl.focus();
                });
            }
        }
    });

    // Warm the next still, so the first click swaps instantly. Last, so a bad data-stills can't stop the
    // handlers above from being bound. (Runs on full page loads; Turbo visits get it on the first click.)
    try {
        var firstStill = document.querySelector('.still-cycle');
        if (firstStill) {
            var list = JSON.parse(firstStill.getAttribute('data-stills'));
            var at = parseInt(firstStill.getAttribute('data-index') || '0', 10);
            if (list.length > 1) preload(list[(at + 1) % list.length].src);
        }
    } catch (e) { }
})();
