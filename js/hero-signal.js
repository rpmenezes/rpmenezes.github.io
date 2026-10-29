// Hero for the videos page: signal to network. A dotted waveform rolls in from
// the left and its crest breaks off into particles that drift right and settle
// into a small floating network, which lights up where they land.
// Requires js/hero-runner.js.
(function () {
    const G = '0,125,105';
    function placeSites(x0, y0, w, h, n, minD) {
        const pts = [];
        for (let tries = 0; pts.length < n && tries < 3000; tries++) {
            const p = { x: x0 + Math.random() * w, y: y0 + Math.random() * h };
            if (pts.every(q => Math.hypot(p.x - q.x, p.y - q.y) > minD)) pts.push(p);
        }
        return pts;
    }
    const sketch = {
        init(W, H) {
            const nodes = placeSites(W * 0.6, H * 0.16, W * 0.3, H * 0.68, 9, Math.min(W, H) * 0.17).map(p => ({
                bx: p.x, by: p.y, x: p.x, y: p.y, ph: Math.random() * 6.28, amp: 3 + Math.random() * 3,
                r: 2.2 + Math.random() * 1.8, glow: 0 }));
            const edges = [], seen = new Set();
            nodes.forEach((a, i) => {
                nodes.map((b, j) => [j, Math.hypot(a.bx - b.bx, a.by - b.by)]).filter(([j]) => j !== i)
                    .sort((p, q) => p[1] - q[1]).slice(0, 2).forEach(([j]) => {
                        const key = Math.min(i, j) + '-' + Math.max(i, j);
                        if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
                    });
            });
            return { nodes, edges, parts: [], time: 0, acc: 0, xa: W * 0.08, xb: W * 0.48 };
        },
        step(ctx, s, k, W, H) {
            s.time += k * 16.67;
            const t = s.time;
            const waveY = x => {
                const u = (x - s.xa) / (s.xb - s.xa);
                const A = H * 0.24 * Math.pow(Math.max(u, 0), 0.8);
                return H / 2 + A * (0.6 * Math.sin(x * 0.045 - t * 0.0035) + 0.4 * Math.sin(x * 0.1 - t * 0.006));
            };
            for (let x = s.xa; x <= s.xb; x += 5) {
                const u = (x - s.xa) / (s.xb - s.xa);
                ctx.beginPath(); ctx.arc(x, waveY(x), 1.1 + u * 0.8, 0, 6.28);
                ctx.fillStyle = 'rgba(' + G + ',' + (0.12 + 0.6 * u) + ')'; ctx.fill();
            }
            for (const n of s.nodes) {
                n.x = n.bx + Math.sin(t * 0.0006 + n.ph) * n.amp;
                n.y = n.by + Math.cos(t * 0.0005 + n.ph * 1.3) * n.amp;
                n.glow = Math.max(0, n.glow - 0.015 * k);
            }
            s.acc += 0.05 * k;
            if (s.acc >= 1) {
                s.acc -= 1;
                s.parts.push({ x0: s.xb, y0: waveY(s.xb), to: Math.floor(Math.random() * s.nodes.length),
                    t: 0, inc: 0.009 + Math.random() * 0.005, bend: (Math.random() - 0.5) * H * 0.5 });
            }
            for (const [i, j] of s.edges) {
                const a = s.nodes[i], b = s.nodes[j];
                ctx.strokeStyle = 'rgba(' + G + ',' + (0.15 + 0.3 * Math.max(a.glow, b.glow)) + ')';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
            for (const p of s.parts) {
                p.t += p.inc * k;
                const n = s.nodes[p.to], u = Math.min(p.t, 1), e = u * u * (3 - 2 * u);
                const cx = (p.x0 + n.x) / 2, cy = (p.y0 + n.y) / 2 + p.bend;
                const x = (1 - e) * (1 - e) * p.x0 + 2 * (1 - e) * e * cx + e * e * n.x;
                const y = (1 - e) * (1 - e) * p.y0 + 2 * (1 - e) * e * cy + e * e * n.y;
                ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.28);
                ctx.fillStyle = 'rgba(' + G + ',0.8)'; ctx.fill();
                if (p.t >= 1) { p.done = true; n.glow = 1; }
            }
            s.parts = s.parts.filter(p => !p.done);
            for (const n of s.nodes) {
                const r = n.r + n.glow * 1.6;
                ctx.beginPath(); ctx.arc(n.x, n.y, r + 4 + n.glow * 3, 0, 6.28);
                ctx.fillStyle = 'rgba(' + G + ',' + (0.08 + 0.18 * n.glow) + ')'; ctx.fill();
                ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.28);
                ctx.fillStyle = 'rgba(' + G + ',0.88)'; ctx.fill();
            }
        }
    };
    document.querySelectorAll('.hero-anim canvas').forEach(c => runHero(c, sketch));
})();
