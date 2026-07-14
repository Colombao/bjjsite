/* ---------- Sons via Web Audio (100% offline) ---------- */
export const Sound = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  bell() {
    this.init();
    const ctx = this.ctx, now = ctx.currentTime;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(440, now);
    o1.frequency.exponentialRampToValueAtTime(110, now + 1.8);
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(659.25, now);
    o2.frequency.exponentialRampToValueAtTime(164.81, now + 1.4);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    o1.start(now); o2.start(now); o1.stop(now + 2.2); o2.stop(now + 2.2);
  },
  buzzer() {
    this.init();
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, now);
    o.frequency.linearRampToValueAtTime(85, now + 1.0);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 1.1);
  },
  beep() {
    this.init();
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(800, now);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.15);
  },
};

export const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ---------- Modos predefinidos ---------- */
export const DEFAULT_MODES = [
  { name: 'Rola Normal',    numRounds: 5,  workMin: 5, workSec: 0,  restMin: 1, restSec: 0,  prepSec: 10 },
  { name: 'Raspa e Passa',  numRounds: 10, workMin: 2, workSec: 0,  restMin: 0, restSec: 30, prepSec: 10 },
  { name: 'Treino (Drill)', numRounds: 6,  workMin: 3, workSec: 0,  restMin: 0, restSec: 45, prepSec: 15 },
];

export const PHASE_TXT = {
  prepare: { title: 'Preparação', hint: 'Ajuste a postura e amarre a faixa.' },
  work: { title: 'Combate', hint: 'Foco total no rola — passagem e finalização.' },
  rest: { title: 'Descanso', hint: 'Respire fundo, hidrate-se e recupere o gás.' },
  finished: { title: 'Treino concluído', hint: 'Oss! Excelente sessão de rolas hoje.' },
};
