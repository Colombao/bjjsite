import { useState, useEffect, useRef } from 'react';

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalSeconds: number;
}

export const useTimer = (initialMinutes: number = 5) => {
  const [state, setState] = useState<TimerState>({
    minutes: initialMinutes,
    seconds: 0,
    isRunning: false,
    totalSeconds: initialMinutes * 60,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          let { minutes, seconds, totalSeconds } = prev;

          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else {
            return { ...prev, isRunning: false };
          }

          totalSeconds = minutes * 60 + seconds;
          return { minutes, seconds, isRunning: true, totalSeconds };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning]);

  const toggle = () => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const reset = (minutes: number = initialMinutes) => {
    setState({
      minutes,
      seconds: 0,
      isRunning: false,
      totalSeconds: minutes * 60,
    });
  };

  const setTime = (minutes: number, seconds: number = 0) => {
    setState({
      minutes,
      seconds,
      isRunning: false,
      totalSeconds: minutes * 60 + seconds,
    });
  };

  const addMinute = () => {
    setState((prev) => {
      const newMinutes = prev.minutes + 1;
      return {
        ...prev,
        minutes: newMinutes,
        totalSeconds: newMinutes * 60 + prev.seconds,
      };
    });
  };

  const subtractMinute = () => {
    setState((prev) => {
      const newMinutes = Math.max(0, prev.minutes - 1);
      return {
        ...prev,
        minutes: newMinutes,
        totalSeconds: newMinutes * 60 + prev.seconds,
      };
    });
  };

  return {
    ...state,
    toggle,
    reset,
    setTime,
    addMinute,
    subtractMinute,
    formatted: `${String(state.minutes).padStart(2, '0')}:${String(state.seconds).padStart(2, '0')}`,
  };
};
