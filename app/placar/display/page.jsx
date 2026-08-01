'use client';

import { useEffect, useReducer, useCallback } from 'react';
import RemoteBridge from '../RemoteBridge';
import { DEFAULT_STATE, applyCtrl, tickTempo } from '../state';
import '../display.css';

const initial = { match: DEFAULT_STATE, running: false, showQR: true };

function reducer(state, action) {
  switch (action.type) {
    case 'remote': {
      const next = applyCtrl(state.match, state.running, action.msg);
      return { ...state, match: next.match, running: next.running };
    }
    case 'tick': {
      if (!state.running) return state;
      const t = tickTempo(state.match.tempo);
      if (t.done) return { ...state, running: false };
      return {
        ...state,
        match: { ...state.match, tempo: t.tempo },
      };
    }
    case 'showQR':
      return { ...state, showQR: action.value };
    default:
      return state;
  }
}

export default function PlacarDisplay() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { match, running, showQR } = state;

  useEffect(() => {
    const onCtrl = (e) => dispatch({ type: 'remote', msg: e.detail || {} });
    window.addEventListener('pc-remote-ctrl', onCtrl);
    return () => window.removeEventListener('pc-remote-ctrl', onCtrl);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [running]);

  const onShowModalChange = useCallback((v) => {
    dispatch({ type: 'showQR', value: v });
  }, []);

  return (
    <div className="display-container">
      <div className="display-header">
        <h1>PLACAR JUJITSU</h1>
        <div className="display-header-actions">
          <RemoteBridge
            match={match}
            running={running}
            autoStart
            showModal={showQR}
            onShowModalChange={onShowModalChange}
          />
        </div>
      </div>

      <div className="display-main">
        <div className="atleta-row">
          <div className="atleta-header">
            <div className="nome">{match.atletaA.nome}</div>
            <div className="team">{match.atletaA.team}</div>
          </div>
          <div className="pontos-row">
            <div className="ponto p2">
              <span className="valor">{match.atletaA.pontos}</span>
            </div>
            <div className="ponto vantagem">
              <span className="valor">{match.atletaA.vantagem}</span>
            </div>
            <div className="ponto penalidade">
              <span className="valor">{match.atletaA.penalidade}</span>
            </div>
          </div>
        </div>

        <div className="atleta-row">
          <div className="atleta-header">
            <div className="nome">{match.atletaB.nome}</div>
            <div className="team">{match.atletaB.team}</div>
          </div>
          <div className="pontos-row">
            <div className="ponto p2">
              <span className="valor">{match.atletaB.pontos}</span>
            </div>
            <div className="ponto vantagem">
              <span className="valor">{match.atletaB.vantagem}</span>
            </div>
            <div className="ponto penalidade">
              <span className="valor">{match.atletaB.penalidade}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="status-footer">
        <div className={`tempo ${running ? 'tempo--running' : ''}`}>{match.tempo}</div>
        <div className="status">{match.statusLuta}</div>
      </div>
    </div>
  );
}
