// Hero for the About Me page: a dotted world map, centred on the Atlantic,
// with arcs launching from Fortaleza to places lived, worked and visited.
// Requires d3, topojson-client and js/hero-runner.js.
(function () {
    const G = '0,125,105';
    const HOME = [-38.54, -3.72];   // Fortaleza
    const PLACES = [
        [-3.53, 50.72], [-1.08, 53.96], [-0.13, 51.51], [-9.14, 38.72], [2.35, 48.86],
        [12.50, 41.90], [-0.89, 41.65], [7.63, 51.96], [-71.06, 42.36], [-80.60, 28.08],
        [-84.28, 30.44], [-122.42, 37.77], [-99.13, 19.43], [-74.07, 4.71], [-70.67, -33.45],
        [-47.06, -22.90], [-46.63, -23.55], [18.42, -33.92], [77.21, 28.61], [139.69, 35.69],
        [151.21, -33.87], [103.82, 1.35]
    ];
    let land = null;
    const landReady = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
        .then(r => r.json())
        .then(t => { land = topojson.feature(t, t.objects.land); })
        .catch(() => {});

    // Rasterise land once per size, then keep only a grid of dots on land.
    function landDots(proj, W, H) {
        const off = document.createElement('canvas');
        off.width = Math.ceil(W); off.height = Math.ceil(H);
        const oc = off.getContext('2d');
        oc.fillStyle = '#000';
        oc.beginPath(); d3.geoPath(proj, oc)(land); oc.fill();
        const px = oc.getImageData(0, 0, off.width, off.height).data;
        const dots = [], step = 4.5;
        for (let y = step / 2; y < H; y += step)
            for (let x = step / 2; x < W; x += step)
                if (px[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 128) dots.push([x, y]);
        return dots;
    }

    const sketch = {
        init(W, H) {
            // Atlantic-centred and zoomed so Fortaleza sits near the middle;
            // far destinations sweep out past the faded edges.
            const proj = d3.geoEqualEarth().rotate([30, 0]).fitSize([W, H], { type: 'Sphere' });
            proj.scale(proj.scale() * 1.35);
            const c = proj([-35, 18]), t = proj.translate();
            proj.translate([t[0] + W / 2 - c[0], t[1] + H / 2 - c[1]]);
            const s = { proj, home: proj(HOME), dots: null, arcs: [], landed: [], timer: 400, time: 0, W, H };
            landReady.then(() => { if (land) s.dots = landDots(proj, W, H); });
            return s;
        },
        step(ctx, s, k) {
            s.time += k * 16.67;
            s.timer += k * 16.67;
            if (s.timer > 650 && s.arcs.length < 8) {
                s.timer = 0;
                const dest = PLACES[Math.floor(Math.random() * PLACES.length)];
                s.arcs.push({ interp: d3.geoInterpolate(HOME, dest), dest: s.proj(dest), t: 0,
                              inc: 0.008 + Math.random() * 0.004, landed: false });
            }

            if (s.dots) {
                ctx.fillStyle = 'rgba(' + G + ',0.22)';
                for (const [x, y] of s.dots) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
            }

            const TAIL = 0.35;
            ctx.lineWidth = 1.3; ctx.lineCap = 'round';
            for (const a of s.arcs) {
                a.t += a.inc * k;
                const head = Math.min(a.t, 1), t0 = Math.min(Math.max(0, a.t - TAIL), 1), steps = 16;
                let prev = s.proj(a.interp(t0));
                for (let i = 1; i <= steps; i++) {
                    const p = s.proj(a.interp(t0 + (head - t0) * i / steps));
                    ctx.strokeStyle = 'rgba(' + G + ',' + (0.7 * i / steps) + ')';
                    ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
                    prev = p;
                }
                if (a.t < 1) {
                    ctx.beginPath(); ctx.arc(prev[0], prev[1], 1.9, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + G + ',0.95)'; ctx.fill();
                } else if (!a.landed) {
                    a.landed = true;
                    s.landed.push({ x: a.dest[0], y: a.dest[1], r: 1.5, a: 0.5 });
                }
            }
            s.arcs = s.arcs.filter(a => a.t < 1 + TAIL);

            ctx.lineWidth = 1;
            for (const l of s.landed) {
                l.r += 0.35 * k; l.a -= 0.01 * k;
                if (l.a > 0) {
                    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(' + G + ',' + l.a + ')'; ctx.stroke();
                }
            }
            s.landed = s.landed.filter(l => l.a > 0);

            // Fortaleza: steady dot with a slow pulse
            const pulse = (s.time % 2200) / 2200;
            ctx.beginPath(); ctx.arc(s.home[0], s.home[1], 3 + pulse * 9, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + G + ',' + (0.5 * (1 - pulse)) + ')'; ctx.stroke();
            ctx.beginPath(); ctx.arc(s.home[0], s.home[1], 3.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + G + ',1)'; ctx.fill();
        }
    };
    document.querySelectorAll('.hero-anim canvas').forEach(c => runHero(c, sketch));
})();
