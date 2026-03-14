/* ═══════════════════════════════════════════════════
   AIMAILABS — Main JavaScript
   Component loader, WhatsApp widget, Nav, GSAP
   ═══════════════════════════════════════════════════ */

/* ─── COMPONENT LOADER ─── */
(function () {
    function loadComponent(id, path) {
        var el = document.getElementById(id);
        if (!el) return;
        fetch(path)
            .then(function (r) { return r.text(); })
            .then(function (html) {
                el.innerHTML = html;
                // Re-run nav scroll after header loads
                if (id === 'site-header') initNavScroll();
                // Re-run WA widget after footer loads
                if (id === 'site-footer') initWhatsApp();
            })
            .catch(function () {
                console.warn('Component load failed: ' + path);
            });
    }

    loadComponent('site-header', '/components/header.html');
    loadComponent('site-footer', '/components/footer.html');
})();

/* ─── NAV SCROLL BEHAVIOR ─── */
function initNavScroll() {
    window.addEventListener('scroll', function () {
        var n = document.querySelector('nav');
        if (n) {
            n.style.background = window.scrollY > 80 ? 'rgba(4,8,15,0.97)' : 'rgba(4,8,15,0.8)';
        }
    });
}

// Also init immediately for pages with inline header
if (document.querySelector('nav')) {
    initNavScroll();
}

/* ─── WHATSAPP WIDGET ─── */
function initWhatsApp() {
    var WA = '60134553120', isOpen = false;
    var tgl = document.getElementById('waToggle'),
        pnl = document.getElementById('waPanel'),
        cls = document.getElementById('waClose'),
        bdy = document.getElementById('waBody'),
        inp = document.getElementById('waInput'),
        snd = document.getElementById('waSend'),
        qr = document.getElementById('waQuick');

    if (!tgl || !pnl) return;

    function show() { pnl.classList.add('open'); tgl.classList.add('active', 'seen'); isOpen = true; }
    function hide() { pnl.classList.remove('open'); tgl.classList.remove('active'); isOpen = false; }

    function send(msg) {
        var m = document.createElement('div');
        m.style.cssText = 'margin-bottom:10px;display:flex;justify-content:flex-end;opacity:0;transform:translateY(8px);animation:waMsgIn .4s ease forwards';
        m.innerHTML = '<div style="max-width:85%;padding:10px 14px;border-radius:12px 12px 4px 12px;font-size:.85rem;line-height:1.5;background:#1a4a2e;color:#e8edf5"><p>' + msg + '</p><span style="font-size:.65rem;color:#576a8a;display:block;text-align:right;margin-top:4px">Now</span></div>';
        bdy.appendChild(m); bdy.scrollTop = bdy.scrollHeight;
        setTimeout(function () {
            var r = document.createElement('div');
            r.style.cssText = 'margin-bottom:10px;display:flex;justify-content:flex-start;opacity:0;transform:translateY(8px);animation:waMsgIn .4s ease forwards';
            r.innerHTML = '<div style="max-width:85%;padding:10px 14px;border-radius:12px 12px 12px 4px;font-size:.85rem;line-height:1.5;background:#111d35;color:#e8edf5"><p>Opening WhatsApp...</p><span style="font-size:.65rem;color:#576a8a;display:block;text-align:right;margin-top:4px">You\'ll continue the conversation there</span></div>';
            bdy.appendChild(r); bdy.scrollTop = bdy.scrollHeight;
        }, 500);
        setTimeout(function () { window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank'); }, 1000);
    }

    tgl.addEventListener('click', function () { isOpen ? hide() : show(); });
    cls.addEventListener('click', hide);
    snd.addEventListener('click', function () { var v = inp.value.trim(); if (v) { send(v); inp.value = ''; } });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var v = inp.value.trim(); if (v) { send(v); inp.value = ''; } } });
    qr.querySelectorAll('.wa-quick-btn').forEach(function (b) { b.addEventListener('click', function () { send(b.dataset.msg); }); });
    document.addEventListener('click', function (e) { if (isOpen && !document.getElementById('waWidget').contains(e.target)) hide(); });
}

// Init WA if already in DOM (pages with inline footer)
if (document.getElementById('waToggle')) {
    initWhatsApp();
}

/* ─── GSAP ANIMATIONS ─── */
document.addEventListener('DOMContentLoaded', function () {
    if (typeof gsap === 'undefined') {
        // Fallback: IntersectionObserver
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal,.hero-badge,.hero h1,.hero-desc,.hero-actions,.hero-stats').forEach(function (el) { obs.observe(el); });
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance (only on pages with hero)
    if (document.querySelector('.hero-badge')) {
        var heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTL
            .to('.hero-badge', { opacity: 1, y: 0, duration: 0.7 })
            .to('.hero h1', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
            .to('.hero-desc', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
            .to('.hero-actions', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
            .to('.hero-stats', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');

        // Animated stat counters
        document.querySelectorAll('.hero-stat .value').forEach(function (el) {
            var text = el.textContent.trim();
            if (text.indexOf('\u2013') !== -1) {
                var parts = text.split('\u2013');
                var end = parseInt(parts[1]);
                var start = parseInt(parts[0]);
                var suffix = parts[1].replace(/[0-9]/g, '');
                var counter = { lo: 0, hi: 0 };
                gsap.to(counter, {
                    lo: start, hi: end, duration: 2, delay: 1, ease: 'power2.out',
                    onUpdate: function () { el.textContent = Math.round(counter.lo) + '\u2013' + Math.round(counter.hi) + suffix; }
                });
            } else if (text.indexOf('%') !== -1) {
                var num = parseInt(text);
                var obj = { val: 0 };
                gsap.to(obj, { val: num, duration: 1.8, delay: 1, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(obj.val) + '%'; } });
            }
        });
    }

    // Section reveals (works on all pages)
    ScrollTrigger.batch('.reveal', {
        onEnter: function (batch) {
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12, overwrite: true });
        },
        start: 'top 88%'
    });

    // Element-specific animations (safe — only runs if elements exist)
    gsap.utils.toArray('.pipeline-step').forEach(function (step, i) { gsap.from(step, { scrollTrigger: { trigger: step, start: 'top 85%' }, opacity: 0, x: -30, duration: 0.6, delay: i * 0.15, ease: 'power2.out' }); });
    document.querySelectorAll('.products-grid').forEach(function (grid) { gsap.utils.toArray(grid.querySelectorAll('.product-card')).forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 90%' }, opacity: 0, y: 40, scale: 0.97, duration: 0.6, delay: i * 0.08, ease: 'power2.out' }); }); });
    gsap.utils.toArray('.platform-system').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 88%' }, opacity: 0, y: 40, scale: 0.97, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }); });
    gsap.utils.toArray('.tech-card').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 88%' }, opacity: 0, y: 30, duration: 0.5, delay: i * 0.08, ease: 'power2.out' }); });
    gsap.utils.toArray('.disc-card').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 88%' }, opacity: 0, y: 25, scale: 0.97, duration: 0.5, delay: i * 0.06, ease: 'power2.out' }); });
    gsap.utils.toArray('.diff-card').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 88%' }, opacity: 0, y: 30, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }); });
    gsap.utils.toArray('.impact-card').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 88%' }, opacity: 0, y: 30, scale: 0.97, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }); });
    gsap.utils.toArray('.workflow-step').forEach(function (step, i) { gsap.from(step, { scrollTrigger: { trigger: step, start: 'top 85%' }, opacity: 0, y: 40, scale: 0.95, duration: 0.7, delay: i * 0.2, ease: 'back.out(1.2)' }); });
    gsap.utils.toArray('.career-card').forEach(function (card, i) { gsap.from(card, { scrollTrigger: { trigger: card, start: 'top 85%' }, opacity: 0, y: 40, duration: 0.7, delay: i * 0.15, ease: 'power2.out' }); });

    if (document.querySelector('.otc-banner')) {
        gsap.from('.otc-banner', { scrollTrigger: { trigger: '.otc-banner', start: 'top 85%' }, opacity: 0, y: 30, scale: 0.98, duration: 0.8, ease: 'power2.out' });
    }
    if (document.querySelector('.cta-section .section-label')) {
        gsap.from('.cta-section .section-label', { scrollTrigger: { trigger: '.cta-section', start: 'top 80%' }, opacity: 0, y: 20, duration: 0.6 });
        gsap.from('.cta-section .section-title', { scrollTrigger: { trigger: '.cta-section', start: 'top 80%' }, opacity: 0, y: 30, duration: 0.7, delay: 0.1 });
        gsap.from('.cta-section .section-desc', { scrollTrigger: { trigger: '.cta-section', start: 'top 80%' }, opacity: 0, y: 20, duration: 0.6, delay: 0.2 });
    }

    // Section heading parallax
    gsap.utils.toArray('section:not(.hero):not(.cta-section)').forEach(function (section) {
        var title = section.querySelector('.section-title');
        if (title) {
            gsap.to(title, { scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 }, y: -15, ease: 'none' });
        }
    });
});
