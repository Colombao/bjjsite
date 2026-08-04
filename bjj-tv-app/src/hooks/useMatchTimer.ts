import { useEffect, useState } from 'react';
import { formatTime } from './useRoundTimer';

/** Timer simples de luta (placar) — countdown em segundos. */
export function useMatchTimer(initialSec = 300) {
  const [totalSec, setTotalSec] = useState(initialSec);
  const [left, setLeft] = useState(initialSec);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const setMinutes = (min: number) => {
    const sec = Math.max(0, min) * 60;
    setTotalSec(sec);
    setLeft(sec);
    setRunning(false);
  };

  const addMinute = (delta: number) => {
    setLeft((t) => {
      const next = Math.max(0, t + delta * 60);
      setTotalSec(next);
      return next;
    });
  };

  return {
    left,
    formatted: formatTime(left),
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setLeft(totalSec);
      setRunning(false);
    },
    setMinutes,
    addMinute,
  };
}
