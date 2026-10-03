// Shared runner for the small animated heroes beside page titles.
// A sketch is { init(W, H, ctx) -> state, step(ctx, state, k, W, H) }, where
// k is the elapsed time in 60fps frames (so speed is independent of refresh
// rate). Handles DPR, re-init on resize, pausing while off-screen, and a
// still frame for visitors who prefer reduced motion.
// Usage: <div class="hero-anim" aria-hidden="true"><canvas></canvas></div>
window.runHero = function (canvas, sketch) {
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
        state = sketch.init(W, H, ctx);
        if (reduce) {
            for (let i = 0; i < 300; i++) { ctx.clearRect(0, 0, W, H); sketch.step(ctx, state, 1, W, H); }
        }
    }
    new ResizeObserver(resize).observe(host);
    resize();
    if (reduce) return;

    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
    function frame(ts) {
        const k = Math.max(0, Math.min(ts - last, 100)) / 16.67;
        last = ts;
        if (state && visible) { ctx.clearRect(0, 0, W, H); sketch.step(ctx, state, k, W, H); }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};
