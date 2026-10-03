// Hero animation for inner pages: a small mobility network that gently floats
// beside the page title. Places link to their nearest neighbours, edge weight
// follows a gravity model (drawn as line thickness), and particles flow along
// each edge in proportion to it. Usage: <div class="hero-anim"><canvas></canvas></div>
(function () {
    const G = '0,125,105';

    // Scatter n points at least minD apart, keeping a margin m from the edges.
    function placeSites(W, H, n, minD, m) {
        const pts = [];
        for (let tries = 0; pts.length < n && tries < 3000; tries++) {
            const p = { x: m + Math.random() * (W - 2 * m), y: m + Math.random() * (H - 2 * m) };
            if (pts.every(q => Math.hypot(p.x - q.x, p.y - q.y) > minD)) pts.push(p);
        }
        return pts;
    }

    function init(W, H) {
        const nodes = placeSites(W, H, 14, Math.min(W, H) * 0.2, 18).map(p => ({
            bx: p.x, by: p.y, x: p.x, y: p.y, pop: 0.25 + Math.pow(Math.random(), 2),
            ph: Math.random() * Math.PI * 2, amp: 3 + Math.random() * 4 }));
        const edges = [], seen = new Set();
        nodes.forEach((a, i) => {
            nodes.map((b, j) => [j, Math.hypot(a.bx - b.bx, a.by - b.by)])
                .filter(([j]) => j !== i)
                .sort((p, q) => p[1] - q[1])
                .slice(0, 2)
                .forEach(([j, d]) => {
                    const key = Math.min(i, j) + '-' + Math.max(i, j);
                    if (seen.has(key)) return;
                    seen.add(key);
                    edges.push({ a: i, b: j, w: a.pop * nodes[j].pop / Math.pow(d / 100, 2), acc: Math.random() });
                });
        });
        const maxW = Math.max(...edges.map(e => e.w), 1e-9);
        edges.forEach(e => e.w /= maxW);
        return { nodes, edges, parts: [], time: 0 };
    }

    // k = elapsed time in 60fps frames, so speed is independent of refresh rate.
    function step(ctx, s, k) {
        s.time += k * 16.67;
        for (const n of s.nodes) {
            n.x = n.bx + Math.sin(s.time * 0.0006 + n.ph) * n.amp;
            n.y = n.by + Math.cos(s.time * 0.0005 + n.ph * 1.3) * n.amp;
        }
        for (const e of s.edges) {
            const a = s.nodes[e.a], b = s.nodes[e.b];
            ctx.strokeStyle = 'rgba(' + G + ',' + (0.10 + e.w * 0.25) + ')';
            ctx.lineWidth = 0.6 + e.w * 2;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            e.acc += k * (0.004 + e.w * 0.03);
            if (e.acc >= 1) {
                e.acc -= 1;
                s.parts.push({ e, fwd: Math.random() < 0.5, t: 0, inc: 0.008 + Math.random() * 0.006 });
            }
        }
        for (const p of s.parts) {
            p.t += p.inc * k;
            const a = s.nodes[p.fwd ? p.e.a : p.e.b], b = s.nodes[p.fwd ? p.e.b : p.e.a];
            ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 1.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + G + ',0.9)'; ctx.fill();
        }
        s.parts = s.parts.filter(p => p.t < 1);
        for (const n of s.nodes) {
            const r = 2 + n.pop * 2.6;
            ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + G + ',0.10)'; ctx.fill();
            ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + G + ',0.9)'; ctx.fill();
        }
    }

    // DPR-aware canvas, re-init on resize, paused while off-screen, and a
    // still frame for visitors who prefer reduced motion.
    function run(canvas) {
        const ctx = canvas.getContext('2d');
        const host = canvas.parentElement;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let W = 0, H = 0, state = null, last = performance.now(), visible = true;

        function resize() {
            const r = host.getBoundingClientRect();
            if (!r.width || !r.height) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = r.width; H = r.height;
            canvas.width = W * dpr; canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            state = init(W, H);
            if (reduce) {
                for (let i = 0; i < 300; i++) { ctx.clearRect(0, 0, W, H); step(ctx, state, 1); }
            }
        }
        new ResizeObserver(resize).observe(host);
        resize();
        if (reduce) return;

        new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
        function frame(ts) {
            const k = Math.max(0, Math.min(ts - last, 100)) / 16.67;
            last = ts;
            if (state && visible) { ctx.clearRect(0, 0, W, H); step(ctx, state, k); }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    document.querySelectorAll('.hero-anim canvas').forEach(run);
})();
