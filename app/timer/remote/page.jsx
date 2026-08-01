'use client';

import { useState, useEffect, useRef } from 'react';
import '../timer.css';

const PEER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

export default function RemotePage() {
  const [status, setStatus] = useState('connecting'); // no-id|connecting|connected|closed|error
  const [modes, setModes] = useState([]);
  const [pls, setPls] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [toast, setToast] = useState('');
  const connRef = useRef(null);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) { setStatus('no-id'); return; }
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
            if (msg?.kind === 'hello') {
              if (Array.isArray(msg.modes)) setModes(msg.modes);
              if (Array.isArray(msg.playlists)) setPls(msg.playlists);
            } else if (msg?.kind === 'playlists' && Array.isArray(msg.names)) {
              setPls(msg.names);
            }
          });
          conn.on('close', () => setStatus('closed'));
          conn.on('error', () => setStatus('error'));
        });
        peer.on('error', () => setStatus('error'));
      } catch { setStatus('error'); }
    })();
    return () => peer?.destroy();
  }, []);

  const send = (msg) => { try { connRef.current?.send(msg); } catch {} };

  const ctrl = (action, extra = {}) => {
    send({ kind: 'ctrl', action, ...extra });
    flash('Comando enviado ✓');
  };

  const music = (action, extra = {}) => {
    send({ kind: 'music', action, ...extra });
    flash('Comando enviado ✓');
  };

  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2500); };

  const sendPlaylist = () => {
    if (!url.trim()) return;
    send({ kind: 'playlist', url: url.trim(), name: name.trim() });
    flash('Playlist enviada para a TV! 🎵');
    setName(''); setUrl('');
  };

  const paste = async () => {
    try { setUrl(await navigator.clipboard.readText()); } catch {}
  };

  const statusTxt = {
    'no-id': 'Link inválido — escaneie o QR code exibido na TV.',
    connecting: 'Conectando à TV…',
    connected: '✓ Conectado à TV',
    closed: 'Conexão encerrada. Escaneie o QR de novo.',
    error: 'Não foi possível conectar. Escaneie o QR de novo na TV.',
  }[status];

  const on = status === 'connected';

  return (
    <main className="rm-page">
      <header className="rt-brand" style={{ justifyContent: 'center' }}>
        <img src="/img/logo-heishikan.png" alt="CT Heishikan" />
        <div>
          <div className="rt-brand-top">CT HEISHIKAN</div>
          <div className="rt-brand-sub">Controle Remoto do Timer</div>
        </div>
      </header>

      <span className={`rt-qr-status ${on ? 'rt-qr-status--ok' : ''}`} style={{ textAlign: 'center' }}>
        {statusTxt}
      </span>

      {on && (
        <>
          <div className="rt-card">
            <h3>Timer</h3>
            <div className="rm-grid">
              <button className="rt-btn rt-btn--gold" onClick={() => ctrl('startPause')}>
                ▶❚❚ Iniciar / Pausar
              </button>
              <button className="rt-btn" onClick={() => ctrl('reset')}>↺ Zerar</button>
              <button className="rt-btn" onClick={() => ctrl('mute')}>🔊 Mudo</button>
            </div>
          </div>

          {modes.length > 0 && (
            <div className="rt-card">
              <h3>Modos</h3>
              <div className="rt-modes">
                {modes.map((m) => (
                  <button key={m} className="rt-mode-btn" onClick={() => ctrl('mode', { name: m })}>
                    <strong>{m}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rt-card">
            <h3>Música</h3>
            <div className="rm-grid rm-grid--2">
              <button className="rt-btn rt-btn--gold" onClick={() => music('toggle')}>
                ⏯ Tocar / Pausar
              </button>
              <button className="rt-btn" onClick={() => music('restart')}>
                ⏮ Reiniciar faixa
              </button>
            </div>
            {pls.length > 0 && (
              <div className="rt-modes">
                {pls.map((p) => (
                  <button key={p} className="rt-mode-btn" onClick={() => music('playlist', { name: p })}>
                    <strong>♫ {p}</strong>
                  </button>
                ))}
              </div>
            )}
            <p className="rt-scan-tip">
              Toca/pausa o player da TV. Para pular faixas, use o app do Spotify.
            </p>
          </div>

          <div className="rt-card">
            <h3>Enviar Playlist</h3>
            <div className="rt-modal-field">
              <label>Nome (opcional)</label>
              <input
                type="text" placeholder="Ex: Treino pesado" value={name} maxLength={30}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="rt-modal-field">
              <label>Link do Spotify</label>
              <textarea
                rows={3}
                placeholder="Cole aqui o link da playlist…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="rm-grid rm-grid--2">
              <button className="rt-btn" onClick={paste}>📋 Colar</button>
              <button className="rt-btn rt-btn--gold" onClick={sendPlaylist} disabled={!url.trim()}>
                Enviar para a TV
              </button>
            </div>
            <p className="rt-scan-tip">
              No Spotify: playlist → Compartilhar → Copiar link → toque em Colar aqui.
            </p>
          </div>
        </>
      )}

      {toast && <div className="rm-toast">{toast}</div>}
    </main>
  );
}
