/* Blahar & Benyah — site scripts (jQuery 3 compatible rewrite of the Logitrans template main.js) */
(function ($) {
    'use strict';

    /* ---------------------------------------------------------------------------------------------
     * Scroll-reveal animations (WOW.js, uses animate.css classes bundled in plugin.css)
     * ------------------------------------------------------------------------------------------- */
    if (typeof WOW === 'function') {
        new WOW({ mobile: false }).init();
    }

    /* ---------------------------------------------------------------------------------------------
     * Home slider
     * ------------------------------------------------------------------------------------------- */
    var $homeSlider = $('#slider .flexslider');
    if ($homeSlider.length && $.fn.flexslider) {
        $homeSlider.flexslider({
            animation: 'fade',
            slideshowSpeed: 7000,
            animationSpeed: 800,
            pauseOnHover: true
        });
    }

    /* ---------------------------------------------------------------------------------------------
     * About page gallery slider
     * ------------------------------------------------------------------------------------------- */
    var $companySlider = $('.company-slider');
    if ($companySlider.length && $.fn.flexslider) {
        $companySlider.flexslider({
            animation: 'slide',
            slideshow: true,
            controlNav: true
        });
    }

    /* ---------------------------------------------------------------------------------------------
     * Layout helpers carried over from the template
     * ------------------------------------------------------------------------------------------- */
    function sliderEqualHeight() {
        var $slides = $('#slider.home-slider ul li.slide-item');
        var captionHeight = $('#slider.home-slider .caption-wrap').height() || 0;
        if ($slides.length) {
            $slides.css('min-height', captionHeight + 450);
        }
    }

    function pageTitleEqualHeight() {
        var $title = $('.page-title');
        var wrapHeight = $('.page-title .title-wrap').height() || 0;
        if ($title.length) {
            $title.css('min-height', wrapHeight + 300);
        }
    }

    function pullContentUnderHeader() {
        var headerHeight = $('.site-header').outerHeight() || 0;
        $('.home-slider, .page-title').css('margin-top', -headerHeight);
    }

    pullContentUnderHeader();
    $(window).on('load resize', function () {
        sliderEqualHeight();
        pageTitleEqualHeight();
    });

    /* ---------------------------------------------------------------------------------------------
     * Carousels (Owl Carousel 2.3)
     * ------------------------------------------------------------------------------------------- */
    if ($.fn.owlCarousel) {
        $('.services-wrap-carousel').owlCarousel({
            stagePadding: 50,
            loop: true,
            margin: 10,
            nav: true,
            dots: false,
            autoplay: true,
            autoplayTimeout: 6000,
            autoplayHoverPause: true,
            navText: [
                "<i class='icon icon-ios-arrow-thin-left' aria-hidden='true'></i><span class='visually-hidden'>Previous</span>",
                "<i class='icon icon-ios-arrow-thin-right' aria-hidden='true'></i><span class='visually-hidden'>Next</span>"
            ],
            responsive: {
                0: { items: 1, stagePadding: 15 },
                1200: { items: 2 }
            }
        });

        $('.testimonial-carousel').owlCarousel({
            loop: true,
            margin: 30,
            nav: false,
            dots: true,
            autoplay: true,
            autoplayTimeout: 8000,
            autoplayHoverPause: true,
            responsive: {
                0: { items: 1 },
                1000: { items: 2 }
            }
        });

        var $team = $('.team-wrap');
        if ($team.children().length > 1) {
            $team.owlCarousel({
                loop: true,
                margin: 30,
                nav: true,
                navText: [
                    "<i class='icon icon-arrow-left' aria-hidden='true'></i><span class='visually-hidden'>Previous</span>",
                    "<i class='icon icon-arrow-right' aria-hidden='true'></i><span class='visually-hidden'>Next</span>"
                ],
                dots: false,
                responsive: {
                    0: { items: 1 },
                    1000: { items: 3 }
                }
            });
        }
    }

    /* ---------------------------------------------------------------------------------------------
     * Animated number counters (replaces jquery.counterup + Waypoints)
     * ------------------------------------------------------------------------------------------- */
    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) { return; }
        var duration = 2000;
        var start = null;
        function step(ts) {
            if (!start) { start = ts; }
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-GB');
            if (progress < 1) { window.requestAnimationFrame(step); }
        }
        window.requestAnimationFrame(step);
    }

    var counters = document.querySelectorAll('.counter[data-count]');
    if (counters.length) {
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.4 });
            counters.forEach(function (c) { io.observe(c); });
        } else {
            counters.forEach(animateCounter);
        }
    }

    /* ---------------------------------------------------------------------------------------------
     * Mobile slide-in menu
     * ------------------------------------------------------------------------------------------- */
    var body = document.body;
    var wrapper = document.getElementById('main-wrapper');
    var menu = document.getElementById('c-menu--slide-right');
    var mask = document.getElementById('slide-overlay');
    var opener = document.getElementById('slide-buttons');

    function openMenu() {
        body.classList.add('has-active-menu');
        wrapper.classList.add('has-slide-right');
        menu.classList.add('is-active');
        mask.classList.add('is-active');
        opener.setAttribute('aria-expanded', 'true');
        menu.inert = false;
        menu.removeAttribute('inert');
        var closeBtn = menu.querySelector('.c-menu__close');
        if (closeBtn) { closeBtn.focus(); }
    }

    function closeMenu() {
        body.classList.remove('has-active-menu');
        wrapper.classList.remove('has-slide-right');
        menu.classList.remove('is-active');
        mask.classList.remove('is-active');
        opener.setAttribute('aria-expanded', 'false');
        menu.inert = true;
        menu.setAttribute('inert', '');
        opener.focus();
    }

    if (menu && mask && opener && wrapper) {
        opener.addEventListener('click', function (e) { e.preventDefault(); openMenu(); });
        mask.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); });
        var close = menu.querySelector('.c-menu__close');
        if (close) { close.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); }); }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-active')) { closeMenu(); }
        });

        // Sub-menu toggles
        menu.querySelectorAll('.slide-menu-items li.has-sub > .submenu-toggle').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var li = btn.parentNode;
                var open = li.classList.toggle('open');
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
    }

    /* ---------------------------------------------------------------------------------------------
     * Copyright year
     * ------------------------------------------------------------------------------------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = String(new Date().getFullYear());
    });

})(window.jQuery);
