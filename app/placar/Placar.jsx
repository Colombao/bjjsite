'use client';

import { useState } from 'react';
import './placar.css';

export default function Placar() {
  const [match, setMatch] = useState({
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
  });

  const updateAtleta = (athlete, field, value) => {
    setMatch(prev => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: typeof value === 'string' ? value : Math.max(0, value),
      },
    }));
  };

  const updateTempo = (valor) => {
    setMatch(prev => ({
      ...prev,
      tempo: valor,
    }));
  };

  const updateStatus = (status) => {
    setMatch(prev => ({
      ...prev,
      statusLuta: status,
    }));
  };

  const reset = () => {
    setMatch({
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
    });
  };

  return (
    <div className="placar-container">
      <div className="placar-header">
        <h1>PLACAR JUJITSU</h1>
        <p>Padrão CBJJ</p>
      </div>

      {/* DISPLAY DO PLACAR */}
      <div className="placar-display">
        {/* ATLETA A */}
        <div className="atleta-section atletaA">
          <div className="atleta-info">
            <div className="nome">{match.atletaA.nome}</div>
            <div className="team">{match.atletaA.team}</div>
          </div>

          <div className="pontos-grid">
            <div className="ponto-box p2">
              <span className="valor">{match.atletaA.pontos}</span>
            </div>
            <div className="ponto-box vantagem">
              <span className="valor">{match.atletaA.vantagem}</span>
            </div>
            <div className="ponto-box penalidade">
              <span className="valor">{match.atletaA.penalidade}</span>
            </div>
          </div>
        </div>

        {/* ATLETA B */}
        <div className="atleta-section atletaB">
          <div className="pontos-grid">
            <div className="ponto-box p2">
              <span className="valor">{match.atletaB.pontos}</span>
            </div>
            <div className="ponto-box vantagem">
              <span className="valor">{match.atletaB.vantagem}</span>
            </div>
            <div className="ponto-box penalidade">
              <span className="valor">{match.atletaB.penalidade}</span>
            </div>
          </div>

          <div className="atleta-info">
            <div className="nome">{match.atletaB.nome}</div>
            <div className="team">{match.atletaB.team}</div>
          </div>
        </div>

        {/* TEMPO E STATUS */}
        <div className="status-bar">
          <div className="tempo-display">{match.tempo}</div>
          <div className="status-display">{match.statusLuta}</div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="controles">
        <div className="secao-controle">
          <h3>ATLETA A</h3>
          <div className="inputs-grid">
            <div className="input-group">
              <label>Nome</label>
              <input
                type="text"
                value={match.atletaA.nome}
                onChange={(e) => updateAtleta('atletaA', 'nome', e.target.value)}
                className="input-text"
              />
            </div>
            <div className="input-group">
              <label>Time</label>
              <input
                type="text"
                value={match.atletaA.team}
                onChange={(e) => updateAtleta('atletaA', 'team', e.target.value)}
                className="input-text"
              />
            </div>
          </div>

          <div className="score-controls">
            <div className="score-group">
              <label>Pontos</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaA', 'pontos', match.atletaA.pontos - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaA.pontos}</span>
                <button
                  onClick={() => updateAtleta('atletaA', 'pontos', match.atletaA.pontos + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>

            <div className="score-group">
              <label>Vantagem</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaA', 'vantagem', match.atletaA.vantagem - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaA.vantagem}</span>
                <button
                  onClick={() => updateAtleta('atletaA', 'vantagem', match.atletaA.vantagem + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>

            <div className="score-group">
              <label>Penalidade</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaA', 'penalidade', match.atletaA.penalidade - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaA.penalidade}</span>
                <button
                  onClick={() => updateAtleta('atletaA', 'penalidade', match.atletaA.penalidade + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="secao-controle">
          <h3>ATLETA B</h3>
          <div className="inputs-grid">
            <div className="input-group">
              <label>Nome</label>
              <input
                type="text"
                value={match.atletaB.nome}
                onChange={(e) => updateAtleta('atletaB', 'nome', e.target.value)}
                className="input-text"
              />
            </div>
            <div className="input-group">
              <label>Time</label>
              <input
                type="text"
                value={match.atletaB.team}
                onChange={(e) => updateAtleta('atletaB', 'team', e.target.value)}
                className="input-text"
              />
            </div>
          </div>

          <div className="score-controls">
            <div className="score-group">
              <label>Pontos</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaB', 'pontos', match.atletaB.pontos - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaB.pontos}</span>
                <button
                  onClick={() => updateAtleta('atletaB', 'pontos', match.atletaB.pontos + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>

            <div className="score-group">
              <label>Vantagem</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaB', 'vantagem', match.atletaB.vantagem - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaB.vantagem}</span>
                <button
                  onClick={() => updateAtleta('atletaB', 'vantagem', match.atletaB.vantagem + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>

            <div className="score-group">
              <label>Penalidade</label>
              <div className="btn-group">
                <button
                  onClick={() => updateAtleta('atletaB', 'penalidade', match.atletaB.penalidade - 1)}
                  className="btn-minus"
                >
                  −
                </button>
                <span className="score-display">{match.atletaB.penalidade}</span>
                <button
                  onClick={() => updateAtleta('atletaB', 'penalidade', match.atletaB.penalidade + 1)}
                  className="btn-plus"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="secao-controle full">
          <h3>LUTA</h3>
          <div className="tempo-controls">
            <label>Tempo</label>
            <input
              type="text"
              value={match.tempo}
              onChange={(e) => updateTempo(e.target.value)}
              className="input-time"
              placeholder="5:00"
            />
          </div>
          <div className="status-controls">
            <label>Status</label>
            <div className="btn-status-group">
              {['INÍCIO', 'DURANTE', 'FINAL'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  className={`btn-status ${match.statusLuta === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <button onClick={reset} className="btn-reset">
            ZERAR TUDO
          </button>
        </div>
      </div>
    </div>
  );
}
