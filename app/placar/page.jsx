'use client';

import Link from 'next/link';
import './menu.css';

export default function PlacarMenu() {
  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1>BJJ Placar</h1>
        <p>Escolha o modo</p>

        <div className="menu-buttons">
          <Link href="/placar/display" className="menu-btn display-btn">
            <div className="btn-icon">📺</div>
            <div className="btn-text">
              <h2>Tela de Exibição</h2>
              <p>Para a TV (full-screen)</p>
            </div>
          </Link>

          <Link href="/placar/control" className="menu-btn control-btn">
            <div className="btn-icon">📱</div>
            <div className="btn-text">
              <h2>Controle Remoto</h2>
              <p>Para o celular</p>
            </div>
          </Link>
        </div>

        <div className="menu-info">
          <p><strong>TV:</strong> Abra /placar/display</p>
          <p><strong>Celular:</strong> Abra /placar/control</p>
          <p>Os dados sincronizam automaticamente entre os dispositivos.</p>
        </div>
      </div>
    </div>
  );
}
