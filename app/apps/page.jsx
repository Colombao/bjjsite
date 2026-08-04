'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './apps.css';

export default function AppsHubPage() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [installedHint, setInstalledHint] = useState('');

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isIOS && !isStandalone) {
      setInstalledHint('No iPhone: toque em Compartilhar → “Adicionar à Tela de Início”.');
    }
    if (isStandalone) setInstalledHint('App instalado neste aparelho ✓');

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setCanInstall(false);
  };

  return (
    <main className="apps-hub">
      <div className="apps-glow" aria-hidden />
      <header className="apps-header">
        <p className="apps-brand">HEISHIKAN</p>
        <h1>Arena no celular e na TV</h1>
        <p className="apps-lead">
          Use o timer e o placar em tela cheia na TV; controle pelo iPhone ou Android.
        </p>
      </header>

      <section className="apps-grid">
        <Link href="/timer" className="apps-card">
          <span className="apps-eyebrow">Treino</span>
          <h2>Timer</h2>
          <p>Rounds, preparação e descanso. Abra na TV e use o QR para controlar no celular.</p>
        </Link>

        <Link href="/placar/display" className="apps-card">
          <span className="apps-eyebrow">Luta · TV</span>
          <h2>Placar</h2>
          <p>Tela de exibição CBJJ. Escaneie o QR com o celular para marcar pontos ao vivo.</p>
        </Link>

        <Link href="/placar/control" className="apps-card apps-card--soft">
          <span className="apps-eyebrow">Celular</span>
          <h2>Controle</h2>
          <p>Painel do placar no telefone (também abre pelo QR da TV).</p>
        </Link>
      </section>

      <section className="apps-install">
        <h2>Instalar no aparelho</h2>
        <ol>
          <li>
            <strong>Web app (rápido):</strong> abra esta página no Chrome/Safari e adicione à
            tela inicial — funciona offline básico.
          </li>
          <li>
            <strong>App nativo (Expo):</strong> pasta <code>bjj-tv-app</code> no repositório —
            gera APK Android / iOS / Android TV com EAS Build.
          </li>
        </ol>
        {canInstall ? (
          <button type="button" className="apps-install-btn" onClick={install}>
            Instalar Heishikan Arena
          </button>
        ) : null}
        {installedHint ? <p className="apps-hint">{installedHint}</p> : null}
      </section>

      <p className="apps-back">
        <Link href="/">← Voltar ao site</Link>
      </p>
    </main>
  );
}
