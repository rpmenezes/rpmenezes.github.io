// Shared site chrome. Include synchronously right after the menu placeholder:
//   <ul class="nav-menu" data-site-nav></ul>
//   <script src="js/site.js"></script>   (../js/ or ../../js/ in subfolders)
// It fills the menu (the single source of truth for navigation, so editing
// MENU below updates every page), runs the phone menu button and the
// scroll fade-in, and keeps the footer year current via
// <span class="copy-year">2026</span>. Pages need no other copied script.
(function () {
    const MENU = [
        { label: 'Home', href: 'index.html' },
        { label: 'Research', href: 'research.html', children: [
            ['Interests', '#research-interests'],
            ['Publications', '#publications'],
            ['Collaboration Network', '#network'] ] },
        { label: 'Scholarly Engagement', href: 'scholarly-engagement.html', children: [
            ['Editorial and Advisory Roles', '#editorial'],
            ['Supervision', '#students'],
            ['Alumni', '#alumni'],
            ['Selected Collaborators', '#collaborators'] ] },
        { label: 'About Me', href: 'about.html', children: [
            ['Biography', '#biography'],
            ['About Me', '#about-me'],
            ['Passions', '#passions'],
            ['Favourites', '#favourites'],
            ['Visited Places', '#visited-places'],
            ['Personal Motto', '#motto'],
            ['Contact and Social Media', '#contact'] ] },
        { label: 'Videos', href: 'videos.html' },
        { label: 'CV', href: 'cv.html' },
        { label: 'Blog', href: 'blog/blog.html', button: true, section: 'blog/' }
    ];

    // Site root, worked out from this script's own URL (…/js/site.js).
    const script = document.currentScript;
    const root = script ? script.src.replace(/js\/site\.js(\?.*)?$/, '') : '';
    const here = location.href.split('#')[0].split('?')[0];
    const pagePath = here.startsWith(root) ? here.slice(root.length) || 'index.html' : '';

    const ul = document.querySelector('ul.nav-menu[data-site-nav]');
    if (ul && root) {
        ul.innerHTML = MENU.map(item => {
            const active = pagePath === item.href || (item.section && pagePath.startsWith(item.section));
            const cls = 'nav-link' + (item.button ? ' nav-link-btn' : '') + (active ? ' active' : '');
            const link = `<a href="${root + item.href}" class="${cls}">${item.label}</a>`;
            if (!item.children) return `<li>${link}</li>`;
            const sub = item.children
                .map(([label, hash]) => `<li><a href="${root + item.href + hash}">${label}</a></li>`).join('');
            return `<li class="nav-item-dropdown">${link}<ul class="dropdown-menu">${sub}</ul></li>`;
        }).join('');
    }

    // Pages with the shared menu also get the phone menu button and the
    // fade-in of sections as they scroll into view (paper highlight pages have their own).
    const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
    if (ul) ready(() => {
        const toggle = document.querySelector('.nav-toggle');
        if (toggle) {
            const setOpen = open => { ul.classList.toggle('nav-open', open); toggle.setAttribute('aria-expanded', open); };
            toggle.addEventListener('click', () => setOpen(!ul.classList.contains('nav-open')));
            ul.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
        }

        const fadeEls = document.querySelectorAll('.content-section, .hero, .highlights, .intro, .fade-in');
        fadeEls.forEach(el => el.classList.add('fade-in'));
        setTimeout(() => {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
                });
            }, { threshold: 0, rootMargin: '200px 0px 0px 0px' });
            fadeEls.forEach(el => observer.observe(el));
        }, 50);
    });

    const year = String(new Date().getFullYear());
    const setYear = () => document.querySelectorAll('.copy-year').forEach(el => { el.textContent = year; });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setYear);
    else setYear();
})();
