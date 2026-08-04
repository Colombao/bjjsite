import { useCallback, useEffect, useRef, useState } from 'react';

export type Phase = 'prepare' | 'work' | 'rest' | 'finished';

export type TimerConfig = {
  numRounds: number;
  workSec: number;
  restSec: number;
  prepSec: number;
};

export const DEFAULT_MODES: Array<TimerConfig & { name: string }> = [
  { name: 'Rola Normal', numRounds: 5, workSec: 300, restSec: 60, prepSec: 10 },
  { name: 'Raspa e Passa', numRounds: 10, workSec: 120, restSec: 30, prepSec: 10 },
  { name: 'Treino (Drill)', numRounds: 6, workSec: 180, restSec: 45, prepSec: 15 },
];

export function formatTime(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function durationFor(phase: Phase, cfg: TimerConfig) {
  if (phase === 'prepare') return cfg.prepSec;
  if (phase === 'work') return cfg.workSec;
  if (phase === 'rest') return cfg.restSec;
  return 0;
}

export function useRoundTimer(initial: TimerConfig = DEFAULT_MODES[0]) {
  const [config, setConfig] = useState<TimerConfig>(initial);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [timeLeft, setTimeLeft] = useState(initial.prepSec);
  const [running, setRunning] = useState(false);
  const totalRef = useRef(initial.prepSec);
  const stateRef = useRef({ config, round, phase });

  useEffect(() => {
    stateRef.current = { config, round, phase };
  }, [config, round, phase]);

  const applyMode = useCallback((mode: TimerConfig) => {
    setConfig(mode);
    setRound(1);
    setPhase('prepare');
    setRunning(false);
    setTimeLeft(mode.prepSec);
    totalRef.current = mode.prepSec;
  }, []);

  const softReset = useCallback(() => {
    const { config: cfg } = stateRef.current;
    setRound(1);
    setPhase('prepare');
    setRunning(false);
    setTimeLeft(cfg.prepSec);
    totalRef.current = cfg.prepSec;
  }, []);

  const advance = useCallback(() => {
    const { config: cfg, round: r, phase: p } = stateRef.current;
    let nextPhase: Phase = p;
    let nextRound = r;

    if (p === 'prepare') {
      nextPhase = 'work';
    } else if (p === 'work') {
      if (r >= cfg.numRounds) nextPhase = 'finished';
      else nextPhase = 'rest';
    } else if (p === 'rest') {
      nextRound = r + 1;
      nextPhase = 'work';
    }

    const dur = durationFor(nextPhase, cfg);
    totalRef.current = dur;
    setRound(nextRound);
    setPhase(nextPhase);
    setTimeLeft(dur);
    if (nextPhase === 'finished') setRunning(false);
  }, []);

  useEffect(() => {
    if (!running || phase === 'finished') return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          advance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, advance]);

  const toggle = () => {
    if (phase === 'finished') {
      softReset();
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  };

  const progress = totalRef.current > 0 ? 1 - timeLeft / totalRef.current : 0;

  return {
    config,
    setConfig,
    applyMode,
    round,
    phase,
    timeLeft,
    formatted: formatTime(timeLeft),
    running,
    toggle,
    softReset,
    progress,
    total: totalRef.current,
  };
}
