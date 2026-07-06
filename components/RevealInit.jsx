'use client';

import { useEffect } from 'react';

/* Ativa os reveals (.rv) e os contadores ([data-count]) via IntersectionObserver */
export default function RevealInit() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));

    const cio = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const end = +el.dataset.count;
        const suf = end >= 20 ? '+' : '';
        cio.unobserve(el);
        if (reduce) { el.textContent = end + suf; return; }
        const t0 = performance.now(), dur = 1600;
        const tick = (t) => {
          const k = Math.min((t - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(end * ease) + (k === 1 ? suf : '');
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
      { threshold: 0.6 }
    );
    document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

    return () => { io.disconnect(); cio.disconnect(); };
  }, []);

  return null;
}
