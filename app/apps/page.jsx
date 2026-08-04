'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './apps.css';

export default function AppsHubPage() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [installedHint, setInstalledHint] = useState('');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (ios && !isStandalone) {
      setInstalledHint('Use o Safari (não o Chrome) para instalar no iPhone.');
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

        {isIOS ? (
          <div className="apps-ios">
            <p className="apps-ios-title">iPhone / iPad (Safari)</p>
            <ol>
              <li>Abra esta página no <strong>Safari</strong></li>
              <li>Toque em <strong>Compartilhar</strong> (quadrado com seta)</li>
              <li>Escolha <strong>Adicionar à Tela de Início</strong></li>
              <li>Confirme — o ícone Heishikan abre em tela cheia</li>
            </ol>
            <p className="apps-hint">
              App nativo da App Store exige conta Apple Developer (US$ 99/ano) + build EAS.
              Enquanto isso, o atalho Safari é o caminho no iPhone.
            </p>
          </div>
        ) : (
          <ol>
            <li>
              <strong>Android (rápido):</strong> use o botão abaixo ou o menu do Chrome →
              “Instalar app” / “Adicionar à tela inicial”.
            </li>
            <li>
              <strong>APK nativo:</strong> instale <code>heishikan-arena-v1.0.0.apk</code> no
              celular ou TV.
            </li>
            <li>
              <strong>iPhone:</strong> abra <code>/apps</code> no Safari → Compartilhar →
              Adicionar à Tela de Início.
            </li>
          </ol>
        )}

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
