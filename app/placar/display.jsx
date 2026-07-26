'use client';

import { useEffect, useState } from 'react';
import './display.css';

export default function PlacarDisplay() {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    // Sincroniza com localStorage
    const handleStorageChange = () => {
      const data = localStorage.getItem('bjj-placar');
      if (data) {
        setMatch(JSON.parse(data));
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);

    // Check localStorage periodicamente
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!match) {
    return (
      <div className="display-container">
        <div className="loading">Aguardando dados...</div>
      </div>
    );
  }

  return (
    <div className="display-container">
      <div className="display-header">
        <h1>PLACAR JUJITSU</h1>
      </div>

      <div className="display-main">
        {/* ATLETA A */}
        <div className="atleta atleta-a">
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

        {/* ATLETA B */}
        <div className="atleta atleta-b">
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

      {/* STATUS BAR */}
      <div className="status-footer">
        <div className="tempo">{match.tempo}</div>
        <div className="status">{match.statusLuta}</div>
      </div>
    </div>
  );
}
