'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* Extrai tipo e id de links/URIs do Spotify:
   https://open.spotify.com/playlist/XXX  |  spotify:playlist:XXX
   Aceita playlist, album, track e artist. */
const parseSpotify = (str) => {
  const m = String(str).trim().match(/(playlist|album|track|artist)[/:]([A-Za-z0-9]{15,})/);
  return m ? { type: m[1], id: m[2] } : null;
};

const DEFAULT_PLAYLISTS = [
  { name: 'Beast Mode', type: 'playlist', id: '37i9dQZF1DX76Wlfdnj7AP' },
];

export default function SpotifyDial() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [playlists, setPlaylists] = useState(DEFAULT_PLAYLISTS);

  // Modal de adicionar
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  // Scanner QR
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('heishikan_timer_playlists') || 'null');
      if (Array.isArray(saved) && saved.length) setPlaylists(saved);
    } catch {}
  }, []);

  const persist = (next) => {
    setPlaylists(next);
    try { localStorage.setItem('heishikan_timer_playlists', JSON.stringify(next)); } catch {}
  };

  const addFromUrl = (url, name) => {
    const parsed = parseSpotify(url);
    if (!parsed) return false;
    const finalName = (name || '').trim() || `Playlist ${playlists.length + 1}`;
    const next = [...playlists.filter((p) => p.id !== parsed.id), { name: finalName, ...parsed }];
    persist(next);
    setCurrent({ name: finalName, ...parsed });
    return true;
  };

  const submitManual = () => {
    if (addFromUrl(newUrl, newName)) closeModal();
    else setError('Link inválido. Cole um link do Spotify (playlist, álbum ou música).');
  };

  /* ---------- Scanner QR (webcam + BarcodeDetector) ---------- */
  const stopScan = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScan = async () => {
    setScanMsg('');
    if (!('BarcodeDetector' in window)) {
      setScanMsg('Este navegador não suporta leitura de QR. Use o Chrome, ou cole o link manualmente.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);
      // aguarda o <video> montar
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        loopRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              const text = codes[0].rawValue || '';
              if (parseSpotify(text)) {
                stopScan();
                if (addFromUrl(text, newName)) closeModal();
              } else {
                setScanMsg('QR lido, mas não é um link do Spotify. Tente outro.');
              }
            }
          } catch {}
        }, 400);
      }, 100);
    } catch {
      setScanMsg('Não consegui acessar a câmera. Verifique a permissão ou cole o link manualmente.');
    }
  };

  const closeModal = () => {
    stopScan();
    setModal(false);
    setNewName(''); setNewUrl(''); setError(''); setScanMsg('');
  };

  useEffect(() => () => stopScan(), [stopScan]);

  // Playlist enviada pelo celular (controle remoto)
  useEffect(() => {
    const onRemote = (e) => {
      const { url, name } = e.detail || {};
      if (url) addFromUrl(url, name);
    };
    window.addEventListener('rt-remote-playlist', onRemote);
    return () => window.removeEventListener('rt-remote-playlist', onRemote);
  });

  const removePlaylist = (id) => {
    persist(playlists.filter((p) => p.id !== id));
    if (current?.id === id) setCurrent(null);
  };

  return (
    <>
      {/* Player embutido — fica montado para a música não parar */}
      {current && (
        <div className="rt-player">
          <div className="rt-player-head">
            <span>♫ {current.name}</span>
            <button onClick={() => setCurrent(null)} title="Fechar player">✕</button>
          </div>
          <iframe
            title={`Spotify — ${current.name}`}
            src={`https://open.spotify.com/embed/${current.type}/${current.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

      {/* Speed dial */}
      <div className={`rt-dial ${open ? 'rt-dial--open' : ''}`}>
        {open && (
          <div className="rt-dial-menu">
            {playlists.map((p) => (
              <div key={p.id} className="rt-dial-row">
                <button
                  className={`rt-dial-item ${current?.id === p.id ? 'rt-dial-item--active' : ''}`}
                  onClick={() => { setCurrent(p); setOpen(false); }}
                >
                  ♫ {p.name}
                </button>
                <button className="rt-dial-del" onClick={() => removePlaylist(p.id)} title={`Remover ${p.name}`}>
                  ✕
                </button>
              </div>
            ))}
            <button
              className="rt-dial-item rt-dial-item--add"
              onClick={() => { setModal(true); setOpen(false); }}
            >
              + Nova playlist
            </button>
          </div>
        )}

        <button
          className="rt-fab"
          onClick={() => setOpen((o) => !o)}
          title="Playlists do Spotify"
          aria-label="Playlists do Spotify"
        >
          {open ? '✕' : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.05 8.5-.6 11.66 1.33.35.22.46.68.25 1.04zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.16-2.56-11.98-1.4a.94.94 0 1 1-.55-1.8c4.37-1.32 9.8-.68 13.51 1.6.44.27.58.85.31 1.29zm.13-3.4C15.24 8.33 8.85 8.12 5.15 9.24a1.13 1.13 0 1 1-.65-2.15c4.25-1.29 11.28-1.04 15.72 1.6a1.13 1.13 0 0 1-1.12 1.94z" />
            </svg>
          )}
        </button>
      </div>

      {/* Modal de adicionar playlist */}
      {modal && (
        <div className="rt-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="rt-modal">
            <div className="rt-modal-head">
              <h3>Adicionar Playlist</h3>
              <button onClick={closeModal} title="Fechar">✕</button>
            </div>

            {scanning ? (
              <div className="rt-scan">
                <video ref={videoRef} muted playsInline />
                <p>Aponte a câmera para o QR code do celular.</p>
                <p className="rt-scan-tip">
                  No celular: abra a playlist no Spotify → Compartilhar → Copiar link → cole no navegador e use
                  "Compartilhar → QR code" (Android/Chrome), ou gere um QR do link.
                </p>
                {scanMsg && <span className="rt-modal-err">{scanMsg}</span>}
                <button className="rt-btn" onClick={stopScan}>Cancelar leitura</button>
              </div>
            ) : (
              <div className="rt-modal-body">
                <div className="rt-modal-field">
                  <label>Nome da playlist</label>
                  <input
                    type="text"
                    placeholder="Ex: Treino pesado"
                    value={newName}
                    maxLength={30}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="rt-modal-field">
                  <label>Link do Spotify</label>
                  <textarea
                    rows={3}
                    placeholder="Cole aqui o link… Ex: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP"
                    value={newUrl}
                    onChange={(e) => { setNewUrl(e.target.value); setError(''); }}
                  />
                </div>

                {error && <span className="rt-modal-err">{error}</span>}
                {scanMsg && <span className="rt-modal-err">{scanMsg}</span>}

                <button className="rt-btn rt-btn--gold rt-btn--big rt-modal-submit" onClick={submitManual}>
                  Adicionar playlist
                </button>

                <div className="rt-modal-divider"><span>ou</span></div>

                <button className="rt-btn rt-modal-scan-btn" onClick={startScan}>
                  📷 Escanear QR code do celular
                </button>
                <p className="rt-scan-tip">
                  Mostre na tela do celular um QR code com o link da playlist e aponte para a webcam.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
