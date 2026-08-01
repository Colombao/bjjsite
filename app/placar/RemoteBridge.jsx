'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* Ponte TV ⇄ celular via WebRTC (PeerJS), igual ao timer.
   A TV (/placar/display) hospeda a sessão; o celular abre
   /placar/control#<id> e envia comandos de placar. */

const SCRIPTS = {
  peer: 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
  qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
};

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

export default function RemoteBridge({
  match,
  running,
  autoStart = true,
  showModal: showModalProp,
  onShowModalChange,
}) {
  const [internalShow, setInternalShow] = useState(false);
  const show = showModalProp !== undefined ? showModalProp : internalShow;
  const setShow = (v) => {
    if (onShowModalChange) onShowModalChange(v);
    else setInternalShow(v);
  };

  const [status, setStatus] = useState('off'); // off|starting|waiting|connected|error
  const [remoteUrl, setRemoteUrl] = useState('');
  const peerRef = useRef(null);
  const connsRef = useRef([]);
  const qrRef = useRef(null);
  const stateRef = useRef({ match, running });

  useEffect(() => {
    stateRef.current = { match, running };
  }, [match, running]);

  const broadcast = useCallback((payload) => {
    connsRef.current.forEach((c) => {
      try {
        if (c.open) c.send(payload);
      } catch {}
    });
  }, []);

  // Empurra estado atualizado para os celulares conectados
  useEffect(() => {
    broadcast({ kind: 'state', match, running });
  }, [match, running, broadcast]);

  const start = useCallback(async () => {
    setShow(true);
    if (peerRef.current) return;
    setStatus('starting');
    try {
      await Promise.all([loadScript(SCRIPTS.peer), loadScript(SCRIPTS.qr)]);
      const id = 'hshk-p-' + Math.random().toString(36).slice(2, 10);
      const peer = new window.Peer(id);
      peerRef.current = peer;

      peer.on('open', () => {
        setRemoteUrl(`${window.location.origin}/placar/control#${id}`);
        setStatus('waiting');
      });

      peer.on('connection', (conn) => {
        connsRef.current.push(conn);
        conn.on('open', () => {
          setStatus('connected');
          const { match: m, running: r } = stateRef.current;
          conn.send({ kind: 'hello', match: m, running: r });
        });
        conn.on('data', (msg) => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.kind === 'ctrl') {
            window.dispatchEvent(new CustomEvent('pc-remote-ctrl', { detail: msg }));
          } else if (msg.kind === 'ping') {
            try {
              const { match: m, running: r } = stateRef.current;
              conn.send({ kind: 'state', match: m, running: r });
            } catch {}
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
  }, []);

  // Inicia sessão automaticamente na TV
  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    if (show && remoteUrl && qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = '';
      new window.QRCode(qrRef.current, {
        text: remoteUrl,
        width: 220,
        height: 220,
        colorDark: '#0B0A08',
        colorLight: '#F2EBDD',
      });
    }
  }, [show, remoteUrl]);

  useEffect(() => () => peerRef.current?.destroy(), []);

  const statusTxt = {
    starting: 'Iniciando sessão…',
    waiting: 'Aguardando celular… escaneie o QR code.',
    connected: '✓ Celular conectado!',
    error: 'Erro de conexão. Recarregue a TV e tente novamente.',
  }[status];

  return (
    <>
      <button
        className="pc-remote-btn"
        onClick={() => {
          setShow(true);
          start();
        }}
        title="Controle pelo celular"
      >
        📱 Controle
      </button>

      {status === 'connected' && !show && (
        <span className="pc-remote-pill pc-remote-pill--ok">Celular conectado</span>
      )}

      {show && (
        <div
          className="qr-overlay"
          onClick={(e) => e.target === e.currentTarget && setShow(false)}
        >
          <div className="qr-modal">
            <h2>Controle pelo Celular</h2>
            {remoteUrl ? (
              <>
                <div className="qr-container">
                  <div ref={qrRef} />
                </div>
                <p className="qr-url">{remoteUrl}</p>
                <p className="qr-hint">
                  Escaneie com a câmera do celular. Pelo controle você muda nomes,
                  dá pontos e controla o tempo — tudo atualiza na TV na hora.
                </p>
                <p className="qr-hint qr-hint--mute">
                  Funciona com o site publicado (não funciona em localhost).
                </p>
              </>
            ) : (
              <p>Preparando sessão…</p>
            )}
            {statusTxt && (
              <span className={`pc-remote-status ${status === 'connected' ? 'ok' : ''}`}>
                {statusTxt}
              </span>
            )}
            <button onClick={() => setShow(false)} className="qr-close">
              {status === 'connected' ? 'Continuar' : '✕ Fechar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
