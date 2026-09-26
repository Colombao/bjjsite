'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_STATE } from '../state';
import '../control.css';

const PEER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

// Playlists padrão do Spotify para o tatame
const PRESET_PLAYLISTS = [
  { name: '🥊 BJJ Beast Mode', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
  { name: '🥋 Roll & Flow (Hip-Hop)', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd' },
  { name: '⚡ Tatame Cardio & Trap', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdxcBWuJwBLq' },
  { name: '🇧🇷 Rap Nacional Tatame', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZq7rP2Q869N' },
  { name: '🌊 Lo-Fi Jiu-Jitsu Flow', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM' },
  { name: '☀️ Reggae Tatame', url: 'https://open.spotify.com/playlist/37i9dQZF1DXbSjqWVDCKew' },
];

export default function PlacarControl() {
  const [status, setStatus] = useState('connecting'); // no-id|connecting|connected|closed|error
  const [match, setMatch] = useState(DEFAULT_STATE);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [showSpotify, setShowSpotify] = useState(false);
  const [history, setHistory] = useState([]);

  // Horário real
  const [wallClock, setWallClock] = useState('');

  // Modais de edição
  const [editModal, setEditModal] = useState({ open: false, athlete: 'atletaA', nome: '', team: '' });
  const [timeModal, setTimeModal] = useState(false);

  // Spotify
  const [spotifyUrl, setSpotifyUrl] = useState('');

  const connRef = useRef(null);
  const matchRef = useRef(match);
  const runningRef = useRef(running);

  useEffect(() => {
    matchRef.current = match;
    runningRef.current = running;
  }, [match, running]);

  // Relógio atual
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setWallClock(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Conexão WebRTC PeerJS
  useEffect(() => {
    const id = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (!id) {
      setStatus('no-id');
      return undefined;
    }
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
            if (!msg || typeof msg !== 'object') return;
            if (msg.kind === 'hello' || msg.kind === 'state') {
              if (msg.match) {
                setMatch(msg.match);
              }
              if (typeof msg.running === 'boolean') setRunning(msg.running);
            }
          });
          conn.on('close', () => setStatus('closed'));
          conn.on('error', () => setStatus('error'));
        });
        peer.on('error', () => setStatus('error'));
      } catch {
        setStatus('error');
      }
    })();
    return () => peer?.destroy();
  }, []);

  const send = useCallback((msg) => {
    try {
      connRef.current?.send(msg);
    } catch {}
  }, []);

  const ctrl = useCallback((action, extra = {}) => {
    send({ kind: 'ctrl', action, ...extra });
  }, [send]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(''), 2200);
  };

  const addScore = useCallback((athlete, field, delta) => {
    setMatch((prev) => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: Math.max(0, (prev[athlete]?.[field] || 0) + delta),
      },
    }));
    ctrl('score', { athlete, field, delta });
    setHistory((prev) => [...prev, { athlete, field, delta }]);
    try { navigator.vibrate?.(40); } catch {}
  }, [ctrl]);

  const undoLastAction = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) {
        flash('Nada para desfazer');
        return prev;
      }
      const next = [...prev];
      const last = next.pop();
      setMatch((m) => ({
        ...m,
        [last.athlete]: {
          ...m[last.athlete],
          [last.field]: Math.max(0, (m[last.athlete]?.[last.field] || 0) - last.delta),
        },
      }));
      ctrl('score', { athlete: last.athlete, field: last.field, delta: -last.delta });
      const label = last.athlete === 'atletaA' ? 'Atleta A' : 'Atleta B';
      flash(`Desfeito: ${label} (${last.delta > 0 ? '-' : '+'}${Math.abs(last.delta)})`);
      return next;
    });
  }, [ctrl]);

  const swapAthletes = useCallback(() => {
    setMatch((prev) => ({
      ...prev,
      atletaA: { ...prev.atletaB },
      atletaB: { ...prev.atletaA },
    }));
    ctrl('swap');
    flash('Lados trocados ⇆');
  }, [ctrl]);

  // Edição segura do atleta via Modal (sem perda de foco)
  const openEditAthlete = (athlete) => {
    setEditModal({
      open: true,
      athlete,
      nome: match[athlete]?.nome || '',
      team: match[athlete]?.team || '',
    });
  };

  const saveEditAthlete = () => {
    const athlete = editModal.athlete;
    const nome = editModal.nome.trim() || (athlete === 'atletaA' ? 'ATLETA A' : 'ATLETA B');
    const team = editModal.team.trim() || (athlete === 'atletaA' ? 'CT HEISHIKAN' : 'VISITANTE');

    setMatch((prev) => ({
      ...prev,
      [athlete]: { ...prev[athlete], nome, team },
    }));

    ctrl('edit', {
      atletaA: athlete === 'atletaA' ? { nome, team } : match.atletaA,
      atletaB: athlete === 'atletaB' ? { nome, team } : match.atletaB,
      tempo: match.tempo,
    });

    setEditModal({ ...editModal, open: false });
    flash(`Nome de ${athlete === 'atletaA' ? 'Atleta A' : 'Atleta B'} atualizado! ✓`);
  };

  // Envio de playlist do Spotify para a TV
  const sendSpotifyPlaylist = (urlToSend, playlistName) => {
    const targetUrl = urlToSend || spotifyUrl;
    if (!targetUrl.trim()) {
      flash('Cole o link da playlist do Spotify!');
      return;
    }

    send({
      kind: 'spotify',
      action: 'play',
      url: targetUrl.trim(),
      name: playlistName || 'Playlist Selecionada',
    });

    flash(`Tocando "${playlistName || 'Playlist'}" na TV! 🎵`);
  };

  const on = status === 'connected';

  return (
    <div className="control-container">
      {/* TOAST FLUTUANTE */}
      {toast && <div className="control-toast">{toast}</div>}

      {/* CABEÇALHO CLONE DA TV */}
      <header className="control-header">
        <div className="control-header-left">
          <h1 className="header-title">PLACAR JIU-JITSU</h1>
        </div>

        {wallClock && (
          <div className="control-header-center">
            <span className="ctrl-wallclock">{wallClock}</span>
          </div>
        )}

        <div className="control-header-right">
          <span className={`conn-badge ${on ? 'conn-badge--ok' : ''}`}>
            {on ? '● TV Conectada' : '○ Conectando'}
          </span>
          <button
            className={`btn-header-spotify ${showSpotify ? 'active' : ''}`}
            onClick={() => setShowSpotify(!showSpotify)}
            title="Abrir controle do Spotify"
          >
            🎵 Spotify
          </button>
        </div>
      </header>

      {/* GAVETA SPOTIFY (QUANDO ATIVA) */}
      {showSpotify && (
        <section className="spotify-drawer">
          <div className="spotify-card">
            <div className="spotify-card-head">
              <h3>🎵 Playlists para Treino BJJ</h3>
              <button className="spotify-card-close" onClick={() => setShowSpotify(false)}>✕</button>
            </div>
            <div className="preset-grid">
              {PRESET_PLAYLISTS.map((p) => (
                <button
                  key={p.url}
                  disabled={!on}
                  className="preset-btn"
                  onClick={() => sendSpotifyPlaylist(p.url, p.name)}
                >
                  <span className="preset-icon">▶</span>
                  <span className="preset-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="spotify-card">
            <p className="spotify-sub">Ou cole o link de qualquer playlist do seu celular:</p>
            <div className="spotify-custom-form">
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="open.spotify.com/playlist/..."
                className="input-text"
              />
              <button
                disabled={!on}
                onClick={() => sendSpotifyPlaylist()}
                className="btn-send-spotify"
              >
                Tocar ➔
              </button>
            </div>
          </div>
        </section>
      )}

      {/* O PLACAR VISUAL DA TV (CLONE 1:1 INTERATIVO) */}
      <main className="tv-clone-board">
        {/* LINHA ATLETA A (AZUL) */}
        <div className="tv-clone-row tv-clone-row--a">
          {/* Caixa do Nome (Azul) */}
          <div
            className="tv-clone-name tv-clone-name--a"
            onClick={() => openEditAthlete('atletaA')}
            title="Toque para editar o nome"
          >
            <span className="clone-athlete-nome">{match.atletaA.nome}</span>
            <span className="clone-athlete-team">{match.atletaA.team}</span>
            <span className="clone-edit-hint">✎ Editar</span>
          </div>

          {/* Grid de Pontos */}
          <div className="tv-clone-pts">
            <div
              className="tv-clone-cell tv-clone-cell--pts"
              onClick={() => addScore('atletaA', 'pontos', 2)}
              title="Toque para +2 pontos"
            >
              <span className="tv-clone-num">{match.atletaA.pontos}</span>
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--adv"
              onClick={() => addScore('atletaA', 'vantagem', 1)}
              title="Toque para +1 vantagem"
            >
              <span className="tv-clone-num">{match.atletaA.vantagem}</span>
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--pen"
              onClick={() => addScore('atletaA', 'penalidade', 1)}
              title="Toque para +1 punição"
            >
              <span className="tv-clone-num">{match.atletaA.penalidade}</span>
            </div>
          </div>
        </div>

        {/* LINHA ATLETA B (BRANCO) */}
        <div className="tv-clone-row tv-clone-row--b">
          {/* Caixa do Nome (Branco) */}
          <div
            className="tv-clone-name tv-clone-name--b"
            onClick={() => openEditAthlete('atletaB')}
            title="Toque para editar o nome"
          >
            <span className="clone-athlete-nome">{match.atletaB.nome}</span>
            <span className="clone-athlete-team">{match.atletaB.team}</span>
            <span className="clone-edit-hint">✎ Editar</span>
          </div>

          {/* Grid de Pontos */}
          <div className="tv-clone-pts">
            <div
              className="tv-clone-cell tv-clone-cell--pts"
              onClick={() => addScore('atletaB', 'pontos', 2)}
              title="Toque para +2 pontos"
            >
              <span className="tv-clone-num">{match.atletaB.pontos}</span>
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--adv"
              onClick={() => addScore('atletaB', 'vantagem', 1)}
              title="Toque para +1 vantagem"
            >
              <span className="tv-clone-num">{match.atletaB.vantagem}</span>
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--pen"
              onClick={() => addScore('atletaB', 'penalidade', 1)}
              title="Toque para +1 punição"
            >
              <span className="tv-clone-num">{match.atletaB.penalidade}</span>
            </div>
          </div>
        </div>

        {/* LINHA DE TEMPO E STATUS (FOOTER DA TV) */}
        <div className="tv-clone-foot">
          <div
            className="tv-clone-time"
            onClick={() => setTimeModal(true)}
            title="Toque para mudar o tempo da luta"
          >
            <span className="clone-time-val">{match.tempo}</span>
            <span className="clone-time-sub">⏱ Ajustar Tempo</span>
          </div>

          <div
            className={`tv-clone-status ${running ? 'tv-clone-status--running' : 'tv-clone-status--stopped'}`}
            onClick={() => {
              ctrl('startPause');
              flash(running ? 'Pausado ⏸' : 'Iniciado ▶');
            }}
            title="Toque para Iniciar ou Pausar a luta"
          >
            <span className="clone-status-txt">{running ? 'PAUSAR' : 'INÍCIO'}</span>
          </div>
        </div>
      </main>

      {/* BARRA DE CONTROLES RÁPIDOS DA TV */}
      <section className="tv-clone-toolbar">
        {/* Atleta A Side Bar */}
        <div className="toolbar-side-row toolbar-side-row--a">
          <span className="toolbar-side-tag toolbar-side-tag--a">ATLETA A</span>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', 2)}>+2</button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', 3)}>+3</button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', 4)}>+4</button>
          <button className="tb-btn tb-btn--v" onClick={() => addScore('atletaA', 'vantagem', 1)}>+V</button>
          <button className="tb-btn tb-btn--x" onClick={() => addScore('atletaA', 'penalidade', 1)}>+P</button>
          <button
            className="tb-btn tb-btn--sub"
            disabled={match.atletaA.pontos === 0}
            onClick={() => addScore('atletaA', 'pontos', -1)}
            title="Subtrair 1 ponto do atleta A"
          >
            −1
          </button>
        </div>

        {/* Atleta B Side Bar */}
        <div className="toolbar-side-row toolbar-side-row--b">
          <span className="toolbar-side-tag toolbar-side-tag--b">ATLETA B</span>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', 2)}>+2</button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', 3)}>+3</button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', 4)}>+4</button>
          <button className="tb-btn tb-btn--v" onClick={() => addScore('atletaB', 'vantagem', 1)}>+V</button>
          <button className="tb-btn tb-btn--x" onClick={() => addScore('atletaB', 'penalidade', 1)}>+P</button>
          <button
            className="tb-btn tb-btn--sub"
            disabled={match.atletaB.pontos === 0}
            onClick={() => addScore('atletaB', 'pontos', -1)}
            title="Subtrair 1 ponto do atleta B"
          >
            −1
          </button>
        </div>

        {/* Ações Gerais (Idênticas aos botões inferiores da TV) */}
        <div className="toolbar-actions-row">
          <button
            className={`tb-action-btn ${running ? 'tb-action-btn--warn' : 'tb-action-btn--go'}`}
            onClick={() => {
              ctrl('startPause');
              flash(running ? 'Pausado ⏸' : 'Iniciado ▶');
            }}
          >
            {running ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <button className="tb-action-btn" onClick={() => setTimeModal(true)}>
            ⏱ Tempo
          </button>
          <button className="tb-action-btn" onClick={() => openEditAthlete('atletaA')}>
            ✎ Nomes
          </button>
          <button className="tb-action-btn" onClick={undoLastAction} title="Desfazer último ponto adicionado">
            ↶ Desfazer
          </button>
          <button className="tb-action-btn" onClick={swapAthletes} title="Inverter lados">
            ⇄ Trocar Lados
          </button>
          <button
            className="tb-action-btn tb-action-btn--reset"
            onClick={() => {
              if (window.confirm('Deseja realmente zerar todos os pontos e o cronômetro?')) {
                ctrl('reset');
                setHistory([]);
                flash('Placar zerado ✓');
              }
            }}
          >
            ↺ Zerar Placar
          </button>
        </div>
      </section>

      {/* MODAL PARA EDITAR ATLETA (Sem perda de foco ao digitar) */}
      {editModal.open && (
        <div className="modal-overlay" onClick={() => setEditModal({ ...editModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar {editModal.athlete === 'atletaA' ? 'Atleta A (Faixa Azul)' : 'Atleta B (Branco / Visitante)'}</h2>
              <button className="modal-close" onClick={() => setEditModal({ ...editModal, open: false })}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nome do Lutador</label>
                <input
                  type="text"
                  value={editModal.nome}
                  onChange={(e) => setEditModal({ ...editModal, nome: e.target.value })}
                  placeholder="Nome do atleta"
                  className="form-input"
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Equipe / CT</label>
                <input
                  type="text"
                  value={editModal.team}
                  onChange={(e) => setEditModal({ ...editModal, team: e.target.value })}
                  placeholder="Ex: CT HEISHIKAN AURUM"
                  className="form-input"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setEditModal({ ...editModal, open: false })}>
                Cancelar
              </button>
              <button className="btn-modal-save" onClick={saveEditAthlete}>
                Salvar na TV ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AJUSTAR TEMPO DA LUTA */}
      {timeModal && (
        <div className="modal-overlay" onClick={() => setTimeModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⏱ Tempo da Luta</h2>
              <button className="modal-close" onClick={() => setTimeModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">Escolha a duração da luta para enviar à TV:</p>
              <div className="time-select-grid">
                {[3, 4, 5, 6, 7, 8, 10, 12].map((min) => (
                  <button
                    key={min}
                    className={`time-pick-btn ${match.tempo === `${String(min).padStart(2, '0')}:00` ? 'active' : ''}`}
                    onClick={() => {
                      ctrl('timerSet', { minutes: min });
                      flash(`${min} min definidos na TV ✓`);
                      setTimeModal(false);
                    }}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setTimeModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
