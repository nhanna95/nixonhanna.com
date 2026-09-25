(function () {
    'use strict';

    document.addEventListener('click', function (e) {
        var t = e.target;

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
