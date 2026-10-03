// Hero for the Videos page: six classical-guitar strings plucked in a
// finger-style arpeggio (with the occasional strum); each vibrates as a
// decaying standing wave and releases a small note that floats away.
// Requires js/hero-runner.js.
(function () {
    const G = '0,125,105';
    const ARP = [5, 3, 2, 1, 2, 3, 4, 3, 2, 0, 2, 3];   // string indices, 0 = high e
    const sketch = {
        init(W, H) {
            const n = 6, top = H * 0.22, gap = (H * 0.56) / (n - 1);
            const strings = [];
            for (let i = 0; i < n; i++)
                strings.push({ y: top + i * gap, amp: 0, ph: 0, u0: 0.3, w: 0.62 - i * 0.05, lw: 0.7 + i * 0.28 });
            return { strings, notes: [], beat: 0, idx: 0, bar: 0, x0: W * 0.08, x1: W * 0.92, H };
        },
        step(ctx, s, k) {
            const pluck = (i, strength) => {
                const st = s.strings[i];
                st.amp = s.H * 0.045 * strength * (1 + i * 0.08);
                st.ph = 0; st.u0 = 0.22 + Math.random() * 0.2;
                s.notes.push({ x: s.x0 + st.u0 * (s.x1 - s.x0) + (Math.random() - 0.5) * 20, y: st.y - 6,
                               vx: (Math.random() - 0.5) * 0.25, vy: -0.35 - Math.random() * 0.2, a: 0.8,
                               glyph: Math.random() < 0.5 ? '♪' : '♫' });
            };

            s.beat += k * 16.67;
            if (s.beat > 270) {
                s.beat = 0;
                if (s.idx < ARP.length) {
                    pluck(ARP[s.idx], s.idx % 6 === 0 ? 1.2 : 0.85);
                    s.idx++;
                } else if (++s.bar % 3 === 0) {
                    for (let i = 5; i >= 0; i--) setTimeout(() => pluck(i, 1), (5 - i) * 28);   // strum
                    s.idx = 0; s.beat = -700;
                } else {
                    s.idx = 0;
                }
            }

            // nut and bridge
            ctx.strokeStyle = 'rgba(' + G + ',0.35)'; ctx.lineWidth = 2;
            const yTop = s.strings[0].y - 6, yBot = s.strings[5].y + 6;
            ctx.beginPath(); ctx.moveTo(s.x0, yTop); ctx.lineTo(s.x0, yBot); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(s.x1, yTop); ctx.lineTo(s.x1, yBot); ctx.stroke();

            const seg = 64;
            for (const st of s.strings) {
                st.ph += st.w * k;
                st.amp *= Math.pow(0.982, k);
                ctx.strokeStyle = 'rgba(' + G + ',' + (0.35 + Math.min(1, st.amp / 6) * 0.5) + ')';
                ctx.lineWidth = st.lw;
                ctx.beginPath();
                for (let j = 0; j <= seg; j++) {
                    const u = j / seg, x = s.x0 + u * (s.x1 - s.x0);
                    const y = st.y + st.amp * (Math.sin(Math.PI * u) * Math.cos(st.ph)
                                             + 0.3 * Math.sin(2 * Math.PI * u) * Math.cos(2 * st.ph + 0.6));
                    j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                }
                ctx.stroke();
            }

            ctx.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (const nt of s.notes) {
                nt.x += nt.vx * k; nt.y += nt.vy * k; nt.a -= 0.006 * k;
                if (nt.a > 0) { ctx.fillStyle = 'rgba(' + G + ',' + nt.a + ')'; ctx.fillText(nt.glyph, nt.x, nt.y); }
            }
            s.notes = s.notes.filter(nt => nt.a > 0);
        }
    };
    document.querySelectorAll('.hero-anim canvas').forEach(c => runHero(c, sketch));
})();
