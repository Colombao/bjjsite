'use client';

import Link from 'next/link';
import './menu.css';

export default function PlacarMenu() {
  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1>BJJ Placar</h1>
        <p>Sessão ao vivo entre TV e celular</p>

        <div className="menu-buttons">
          <Link href="/placar/display" className="menu-btn display-btn">
            <div className="btn-icon">📺</div>
            <div className="btn-text">
              <h2>Tela de Exibição</h2>
              <p>Abra na TV — mostra o QR da sessão</p>
            </div>
          </Link>

          <div className="menu-btn control-btn menu-btn--disabled">
            <div className="btn-icon">📱</div>
            <div className="btn-text">
              <h2>Controle Remoto</h2>
              <p>Escaneie o QR da TV no celular</p>
            </div>
          </div>
        </div>

        <div className="menu-info">
          <p><strong>1.</strong> Abra <code>/placar/display</code> na TV</p>
          <p><strong>2.</strong> Escaneie o QR com o celular</p>
          <p><strong>3.</strong> Mude nomes e pontos — a TV atualiza na hora</p>
        </div>
      </div>
    </div>
  );
}
