// Hero for the research-side pages: a small mobility network that gently
// floats beside the page title. Places link to their nearest neighbours, edge
// weight follows a gravity model (drawn as line thickness), and particles flow
// along each edge in proportion to it. Requires js/hero-runner.js.
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

    const sketch = {
        init(W, H) {
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
        },

        step(ctx, s, k) {
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
    };

    document.querySelectorAll('.hero-anim canvas').forEach(c => runHero(c, sketch));
})();
