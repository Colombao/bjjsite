'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_STATE } from '../state';
import '../control.css';

const PEER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

export default function PlacarControl() {
  const [status, setStatus] = useState('connecting'); // no-id|connecting|connected|closed|error
  const [match, setMatch] = useState(DEFAULT_STATE);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const connRef = useRef(null);
  const focusedRef = useRef(null);

  useEffect(() => {
    const id = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (!id) {
      setStatus('no-id');
      return undefined;
    }
    let peer;
    (async () => {
      try {
        await loadScript(PEER_SRC);
        peer = new window.Peer();
        peer.on('open', () => {
          const conn = peer.connect(id, { reliable: true });
          connRef.current = conn;
          conn.on('open', () => setStatus('connected'));
          conn.on('data', (msg) => {
            if (!msg || typeof msg !== 'object') return;
            if (msg.kind === 'hello' || msg.kind === 'state') {
              if (msg.match) {
                setMatch((prev) => {
                  // Não sobrescreve o campo que o usuário está digitando
                  const f = focusedRef.current;
                  if (!f) return msg.match;
                  const next = { ...msg.match };
                  if (f.athlete && f.field) {
                    next[f.athlete] = {
                      ...next[f.athlete],
                      [f.field]: prev[f.athlete]?.[f.field],
                    };
                  }
                  return next;
                });
              }
              if (typeof msg.running === 'boolean') setRunning(msg.running);
            }
          });
          conn.on('close', () => setStatus('closed'));
          conn.on('error', () => setStatus('error'));
        });
        peer.on('error', () => setStatus('error'));
      } catch {
        setStatus('error');
      }
    })();
    return () => peer?.destroy();
  }, []);

  const send = (msg) => {
    try {
      connRef.current?.send(msg);
    } catch {}
  };

  const ctrl = (action, extra = {}) => {
    send({ kind: 'ctrl', action, ...extra });
  };

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(''), 1800);
  };

  const addScore = (athlete, field, delta) => {
    // otimista
    setMatch((prev) => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: Math.max(0, prev[athlete][field] + delta),
      },
    }));
    ctrl('score', { athlete, field, delta });
    flash('Ponto enviado ✓');
  };

  const setField = (athlete, field, value) => {
    setMatch((prev) => ({
      ...prev,
      [athlete]: { ...prev[athlete], [field]: value },
    }));
    ctrl('set', { athlete, field, value });
  };

  const statusTxt = {
    'no-id': 'Escaneie o QR code da TV para abrir o controle com a sessão.',
    connecting: 'Conectando à TV…',
    connected: '✓ Conectado à TV — alterações aparecem na hora',
    closed: 'Conexão encerrada. Escaneie o QR de novo na TV.',
    error: 'Não foi possível conectar. Escaneie o QR de novo na TV.',
  }[status];

  const on = status === 'connected';

  const AthleteBlock = ({ id, title }) => (
    <section className={`athlete-control ${id === 'atletaA' ? 'athlete-a' : 'athlete-b'}`}>
      <h2>{title}</h2>

      <div className="input-group">
        <label>Nome</label>
        <input
          type="text"
          value={match[id].nome}
          disabled={!on}
          maxLength={30}
          className="input-text"
          onFocus={() => { focusedRef.current = { athlete: id, field: 'nome' }; }}
          onBlur={() => { focusedRef.current = null; }}
          onChange={(e) => setField(id, 'nome', e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Time</label>
        <input
          type="text"
          value={match[id].team}
          disabled={!on}
          maxLength={30}
          className="input-text"
          onFocus={() => { focusedRef.current = { athlete: id, field: 'team' }; }}
          onBlur={() => { focusedRef.current = null; }}
          onChange={(e) => setField(id, 'team', e.target.value)}
        />
      </div>

      <div className="score-control">
        {[
          ['pontos', 'Pontos'],
          ['vantagem', 'Vantagem'],
          ['penalidade', 'Penalidade'],
        ].map(([field, label]) => (
          <div className="score-item" key={field}>
            <span className="label">{label}</span>
            <div className="button-group">
              <button
                disabled={!on}
                onClick={() => addScore(id, field, -1)}
                className="btn-minus"
              >
                −
              </button>
              <span className="value">{match[id][field]}</span>
              <button
                disabled={!on}
                onClick={() => addScore(id, field, 1)}
                className="btn-plus"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="control-container">
      <div className="control-header">
        <h1>Controle do Placar</h1>
        <p className={`conn-status ${on ? 'conn-status--ok' : ''}`}>{statusTxt}</p>
        {!on && status === 'no-id' && (
          <p className="conn-help">
            Na TV abra <strong>/placar/display</strong> e escaneie o QR code da sessão.
          </p>
        )}
      </div>

      <div className={`control-content ${!on ? 'control-content--dim' : ''}`}>
        <AthleteBlock id="atletaA" title="Atleta A" />
        <AthleteBlock id="atletaB" title="Atleta B" />

        <section className="timer-control">
          <h2>Luta</h2>

          <div className="timer-display">
            <div className="time-value">{match.tempo}</div>
            <div className="time-buttons">
              {[3, 5, 8, 10].map((min) => (
                <button
                  key={min}
                  disabled={!on}
                  onClick={() => {
                    ctrl('timerSet', { minutes: min });
                    flash(`${min} min ✓`);
                  }}
                  className={`time-btn ${match.tempo === `${String(min).padStart(2, '0')}:00` ? 'active' : ''}`}
                >
                  {min}min
                </button>
              ))}
            </div>
          </div>

          <div className="control-buttons">
            <button
              disabled={!on}
              onClick={() => {
                ctrl('startPause');
                flash(running ? 'Pausado ✓' : 'Iniciado ✓');
              }}
              className={`btn-large ${running ? 'btn-pause' : 'btn-play'}`}
            >
              {running ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
          </div>

          <div className="status-buttons">
            <label>Status</label>
            <div className="button-group-status">
              {['INÍCIO', 'DURANTE', 'FINAL'].map((s) => (
                <button
                  key={s}
                  disabled={!on}
                  onClick={() => {
                    ctrl('status', { value: s });
                    flash(`Status: ${s}`);
                  }}
                  className={`status-btn ${match.statusLuta === s ? 'active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!on}
            onClick={() => {
              ctrl('reset');
              flash('Zerado ✓');
            }}
            className="btn-reset"
          >
            Zerar Tudo
          </button>
        </section>
      </div>

      {toast && <div className="pc-toast">{toast}</div>}
    </div>
  );
}
