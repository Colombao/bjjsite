'use client';

import { useState, useEffect } from 'react';
import '../control.css';

const DEFAULT_STATE = {
  atletaA: {
    nome: 'ATLETA A',
    team: 'BJJ TEAM A',
    pontos: 0,
    vantagem: 0,
    penalidade: 0,
  },
  atletaB: {
    nome: 'ATLETA B',
    team: 'BJJ TEAM B',
    pontos: 0,
    vantagem: 0,
    penalidade: 0,
  },
  tempo: '5:00',
  statusLuta: 'FINAL',
};

export default function PlacarControl() {
  const [match, setMatch] = useState(DEFAULT_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const saved = localStorage.getItem('bjj-placar');
    if (saved) {
      try {
        setMatch(JSON.parse(saved));
      } catch (e) {
        localStorage.setItem('bjj-placar', JSON.stringify(DEFAULT_STATE));
      }
    } else {
      localStorage.setItem('bjj-placar', JSON.stringify(DEFAULT_STATE));
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('bjj-placar', JSON.stringify(match));
      window.dispatchEvent(new Event('storage'));
    }
  }, [match, hydrated]);

  const updateAtleta = (athlete, field, value) => {
    setMatch(prev => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: typeof value === 'string' ? value : Math.max(0, value),
      },
    }));
  };

  const addScore = (athlete, field, amount) => {
    setMatch(prev => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: Math.max(0, prev[athlete][field] + amount),
      },
    }));
  };

  const updateStatus = (status) => {
    setMatch(prev => ({ ...prev, statusLuta: status }));
  };

  const reset = () => {
    setMatch(DEFAULT_STATE);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setMatch(prev => {
        const [mins, secs] = prev.tempo.split(':').map(Number);
        let newSecs = secs - 1;
        let newMins = mins;

        if (newSecs < 0) {
          newSecs = 59;
          newMins--;
          if (newMins < 0) {
            setIsRunning(false);
            return prev;
          }
        }

        return {
          ...prev,
          tempo: `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const setTimerMinutes = (mins) => {
    setMatch(prev => ({
      ...prev,
      tempo: `${String(mins).padStart(2, '0')}:00`,
    }));
    setIsRunning(false);
  };

  if (!hydrated) return null;

  return (
    <div className="control-container">
      <div className="control-header">
        <h1>Controle Remoto</h1>
        <p>Abra {typeof window !== 'undefined' ? window.location.origin : ''}/placar/display na TV</p>
      </div>

      <div className="control-content">
        {/* ATLETA A */}
        <section className="athlete-control">
          <h2>Atleta A</h2>

          <div className="input-group">
            <label>Nome</label>
            <input
              type="text"
              value={match.atletaA.nome}
              onChange={(e) => updateAtleta('atletaA', 'nome', e.target.value)}
              className="input-text"
              maxLength={30}
            />
          </div>

          <div className="input-group">
            <label>Time</label>
            <input
              type="text"
              value={match.atletaA.team}
              onChange={(e) => updateAtleta('atletaA', 'team', e.target.value)}
              className="input-text"
              maxLength={30}
            />
          </div>

          <div className="score-control">
            <div className="score-item">
              <span className="label">Pontos</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaA', 'pontos', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaA.pontos}</span>
                <button onClick={() => addScore('atletaA', 'pontos', 1)} className="btn-plus">+</button>
              </div>
            </div>

            <div className="score-item">
              <span className="label">Vantagem</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaA', 'vantagem', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaA.vantagem}</span>
                <button onClick={() => addScore('atletaA', 'vantagem', 1)} className="btn-plus">+</button>
              </div>
            </div>

            <div className="score-item">
              <span className="label">Penalidade</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaA', 'penalidade', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaA.penalidade}</span>
                <button onClick={() => addScore('atletaA', 'penalidade', 1)} className="btn-plus">+</button>
              </div>
            </div>
          </div>
        </section>

        {/* ATLETA B */}
        <section className="athlete-control">
          <h2>Atleta B</h2>

          <div className="input-group">
            <label>Nome</label>
            <input
              type="text"
              value={match.atletaB.nome}
              onChange={(e) => updateAtleta('atletaB', 'nome', e.target.value)}
              className="input-text"
              maxLength={30}
            />
          </div>

          <div className="input-group">
            <label>Time</label>
            <input
              type="text"
              value={match.atletaB.team}
              onChange={(e) => updateAtleta('atletaB', 'team', e.target.value)}
              className="input-text"
              maxLength={30}
            />
          </div>

          <div className="score-control">
            <div className="score-item">
              <span className="label">Pontos</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaB', 'pontos', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaB.pontos}</span>
                <button onClick={() => addScore('atletaB', 'pontos', 1)} className="btn-plus">+</button>
              </div>
            </div>

            <div className="score-item">
              <span className="label">Vantagem</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaB', 'vantagem', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaB.vantagem}</span>
                <button onClick={() => addScore('atletaB', 'vantagem', 1)} className="btn-plus">+</button>
              </div>
            </div>

            <div className="score-item">
              <span className="label">Penalidade</span>
              <div className="button-group">
                <button onClick={() => addScore('atletaB', 'penalidade', -1)} className="btn-minus">−</button>
                <span className="value">{match.atletaB.penalidade}</span>
                <button onClick={() => addScore('atletaB', 'penalidade', 1)} className="btn-plus">+</button>
              </div>
            </div>
          </div>
        </section>

        {/* TIMER E STATUS */}
        <section className="timer-control">
          <h2>Luta</h2>

          <div className="timer-display">
            <div className="time-value">{match.tempo}</div>
            <div className="time-buttons">
              {[3, 5, 8, 10].map(min => (
                <button
                  key={min}
                  onClick={() => setTimerMinutes(min)}
                  className={`time-btn ${match.tempo === `${String(min).padStart(2, '0')}:00` ? 'active' : ''}`}
                >
                  {min}min
                </button>
              ))}
            </div>
          </div>

          <div className="control-buttons">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`btn-large ${isRunning ? 'btn-pause' : 'btn-play'}`}
            >
              {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
          </div>

          <div className="status-buttons">
            <label>Status</label>
            <div className="button-group-status">
              {['INÍCIO', 'DURANTE', 'FINAL'].map(status => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  className={`status-btn ${match.statusLuta === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button onClick={reset} className="btn-reset">
            Zerar Tudo
          </button>
        </section>
      </div>
    </div>
  );
}
