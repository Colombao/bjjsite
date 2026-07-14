'use client';

import { useState, useEffect, useRef } from 'react';

/* Ponte TV ⇄ celular via WebRTC (PeerJS, sem backend próprio).
   A TV mostra um QR com o link /timer/remote#<id>; o celular abre
   e envia comandos (playlist, iniciar/pausar, zerar, modo, mudo). */

const SCRIPTS = {
  peer: 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
  qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
};

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

export default function RemoteBridge({ modeNames = [] }) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('off'); // off|starting|waiting|connected|error
  const [remoteUrl, setRemoteUrl] = useState('');
  const peerRef = useRef(null);
  const connsRef = useRef([]);
  const qrRef = useRef(null);
  const modesRef = useRef(modeNames);

  useEffect(() => { modesRef.current = modeNames; }, [modeNames]);

  const start = async () => {
    setShow(true);
    if (peerRef.current) return;
    setStatus('starting');
    try {
      await Promise.all([loadScript(SCRIPTS.peer), loadScript(SCRIPTS.qr)]);
      const id = 'hshk-' + Math.random().toString(36).slice(2, 10);
      const peer = new window.Peer(id);
      peerRef.current = peer;

      peer.on('open', () => {
        setRemoteUrl(`${window.location.origin}/timer/remote#${id}`);
        setStatus('waiting');
      });

      peer.on('connection', (conn) => {
        connsRef.current.push(conn);
        conn.on('open', () => {
          setStatus('connected');
          conn.send({ kind: 'hello', modes: modesRef.current });
        });
        conn.on('data', (msg) => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.kind === 'ctrl') {
            window.dispatchEvent(new CustomEvent('rt-remote-ctrl', { detail: msg }));
          } else if (msg.kind === 'playlist') {
            window.dispatchEvent(new CustomEvent('rt-remote-playlist', { detail: msg }));
          }
        });
        conn.on('close', () => {
          connsRef.current = connsRef.current.filter((c) => c !== conn);
          if (!connsRef.current.length) setStatus('waiting');
        });
      });

      peer.on('error', () => setStatus('error'));
    } catch {
      setStatus('error');
    }
  };

  // Desenha o QR quando o link estiver pronto
  useEffect(() => {
    if (show && remoteUrl && qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = '';
      new window.QRCode(qrRef.current, {
        text: remoteUrl, width: 220, height: 220,
        colorDark: '#0B0A08', colorLight: '#F2EBDD',
      });
    }
  }, [show, remoteUrl]);

  useEffect(() => () => peerRef.current?.destroy(), []);

  const statusTxt = {
    starting: 'Iniciando conexão…',
    waiting: 'Aguardando celular… escaneie o QR code.',
    connected: '✓ Celular conectado!',
    error: 'Erro de conexão. Feche e tente novamente.',
  }[status];

  return (
    <>
      <button className="rt-btn" onClick={start} title="Controlar pelo celular">
        📱 Controle
      </button>

      {show && (
        <div className="rt-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="rt-modal">
            <div className="rt-modal-head">
              <h3>Controle pelo Celular</h3>
              <button onClick={() => setShow(false)} title="Fechar">✕</button>
            </div>
            <div className="rt-qr-body">
              {remoteUrl ? (
                <>
                  <div className="rt-qr-box"><div ref={qrRef} /></div>
                  <p>Escaneie com a câmera do celular para abrir o controle remoto.</p>
                  <p className="rt-scan-tip">
                    No controle você pode iniciar/pausar, zerar, trocar de modo e enviar playlists do Spotify.
                    Funciona com o site publicado (não funciona em localhost).
                  </p>
                </>
              ) : (
                <p>Preparando…</p>
              )}
              {statusTxt && (
                <span className={`rt-qr-status ${status === 'connected' ? 'rt-qr-status--ok' : ''}`}>
                  {statusTxt}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
