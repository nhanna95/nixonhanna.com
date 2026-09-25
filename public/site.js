(function () {
    'use strict';

    document.addEventListener('click', function (e) {
        var t = e.target;

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
})();
