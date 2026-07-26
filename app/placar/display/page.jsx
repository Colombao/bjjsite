'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import '../display.css';

export default function PlacarDisplay() {
  const [match, setMatch] = useState(null);
  const [showQR, setShowQR] = useState(true);
  const [controlUrl, setControlUrl] = useState('');

  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setControlUrl(`${baseUrl}/placar/control`);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const data = localStorage.getItem('bjj-placar');
      if (data) {
        setMatch(JSON.parse(data));
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);

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
        {/* ATLETA A ROW */}
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

        {/* ATLETA B ROW */}
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

      {/* STATUS BAR */}
      <div className="status-footer">
        <div className="tempo">{match.tempo}</div>
        <div className="status">{match.statusLuta}</div>
      </div>

      {/* QR CODE MODAL */}
      {showQR && controlUrl && (
        <div className="qr-overlay">
          <div className="qr-modal">
            <h2>Escanear no Celular</h2>
            <div className="qr-container">
              <QRCode
                value={controlUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="qr-url">{controlUrl}</p>
            <button onClick={() => setShowQR(false)} className="qr-close">
              ✕ Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
