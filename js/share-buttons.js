// Share buttons for paper highlight pages: X, Bluesky and LinkedIn. Each opens
// that site's post composer in a new tab with the link (and, on X and Bluesky,
// a short text) filled in. The post's image comes from the page's Open Graph
// tags (highlights/cards/<slug>.png), written by tools/share_cards.py.
// Usage on a highlight page: <script src="../js/share-buttons.js"></script>
(function () {
    const script = document.currentScript;
    const asset = path => new URL(path, script.src).href;
    const meta = prop => {
        const el = document.querySelector('meta[property="' + prop + '"]');
        return el ? el.content : '';
    };
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();

    const actions = document.querySelector('.hero-actions');
    if (!actions) return;

    // Canonical link and title from the page's Open Graph tags, so a share
    // made from a local copy still points at the live page.
    const url = meta('og:url') || location.href.split('#')[0];
    const title = meta('og:title') || clean(document.querySelector('h1') && document.querySelector('h1').textContent);
    const heroMeta = clean(document.querySelector('.hero-meta') && document.querySelector('.hero-meta').textContent);
    const journal = (heroMeta.split('·')[1] || '').trim();   // "Research Article · <Journal> · Published …"
    const text = journal ? title + ' (' + journal + ')' : title;
    const enc = encodeURIComponent;

    const targets = [
        { name: 'X', icon: '../icons/x-twitter-brands-solid.png',
          href: 'https://x.com/intent/post?text=' + enc(text) + '&url=' + enc(url) },
        { name: 'Bluesky', icon: '../icons/bluesky-brands-solid.png',
          href: 'https://bsky.app/intent/compose?text=' + enc(text + ' ' + url) },
        { name: 'LinkedIn', icon: '../icons/linkedin-brands-solid.png',
          href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url) },
    ];

    const style = document.createElement('style');
    style.textContent =
        '.share-group { display:inline-flex; align-items:center; gap:0.6rem; flex-wrap:wrap; }' +
        '.share-label { font-size:0.8rem; font-weight:300; color:#999; letter-spacing:0.04em; }' +
        '.share-btn { display:inline-flex; align-items:center; justify-content:center;' +
        ' box-sizing:border-box; width:2.875rem; height:2.875rem; padding:0; }' +
        '.share-btn img { width:16px; height:16px; object-fit:contain; transition:filter 0.2s ease; }' +
        '.share-btn:hover img, .share-btn:focus-visible img { filter:brightness(0) invert(1); }';
    document.head.appendChild(style);

    const group = document.createElement('div');
    group.className = 'share-group';
    group.innerHTML = '<span class="share-label">Share</span>';
    for (const t of targets) {
        const a = document.createElement('a');
        a.className = 'btn-outline share-btn';
        a.href = t.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Share on ' + t.name);
        a.title = 'Share on ' + t.name;   // icon-only, so name it on hover
        a.innerHTML = '<img src="' + asset(t.icon) + '" alt="">';
        group.appendChild(a);
    }
    actions.appendChild(group);
})();
