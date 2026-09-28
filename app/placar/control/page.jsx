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

// Áudio sintético de feedback esportivo para o árbitro (som de apito/bip de confirmação)
const playChime = (success = true) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      // Tom agudo duplo agradável de confirmação esportiva (D5 -> A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {}
};

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

  // Módulo de Voz do Árbitro (Speech to Text Contínuo)
  const [isListening, setIsListening] = useState(false);
  const [liveSpeechText, setLiveSpeechText] = useState('');
  const [lastExecutedCmd, setLastExecutedCmd] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [highlightA, setHighlightA] = useState(false);
  const [highlightB, setHighlightB] = useState(false);

  // Spotify
  const [spotifyUrl, setSpotifyUrl] = useState('');

  const connRef = useRef(null);
  const matchRef = useRef(match);
  const runningRef = useRef(running);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const shouldListenRef = useRef(false); // Flag para escuta contínua de árbitro
  const lastCmdTimeRef = useRef(0);

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
      const label = last.athlete === 'atletaA' ? 'Azul' : 'Branco';
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

  // ============================================================
  // PARSER DE COMANDOS DE ÁRBITRO DE JIU-JITSU (CBJJ / IBJJF)
  // Suporta qualquer ordem das palavras: "queda azul" ou "dois pontos azul"
  // ============================================================
  const parseRefereeVoiceCommand = useCallback((rawText) => {
    if (!rawText) return null;

    const text = rawText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return null;

    const currentMatch = matchRef.current;
    const rawNameA = (currentMatch.atletaA?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const rawNameB = (currentMatch.atletaB?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const nameA = rawNameA.length >= 3 && !['atleta', 'lutador', 'faixa'].includes(rawNameA) ? rawNameA : '';
    const nameB = rawNameB.length >= 3 && !['atleta', 'lutador', 'faixa'].includes(rawNameB) ? rawNameB : '';

    // 1. Comandos de tempo e controle da luta
    if (/\b(combate|valendo|iniciar luta|iniciar tempo|soltar tempo|solta o tempo|comecar|luta|tempo rodando)\b/.test(text)) {
      if (!runningRef.current) ctrl('startPause');
      return { desc: '▶ Combate! (Luta Iniciada)', success: true };
    }

    if (/\b(parou|tempo|para o tempo|parar tempo|pausar luta|pausa|pausar|stop)\b/.test(text)) {
      if (runningRef.current) ctrl('startPause');
      return { desc: '⏸ Parou! (Luta Pausada)', success: true };
    }

    if (/\b(desfazer|desfaz|anular ponto|anular|cancela o ponto)\b/.test(text)) {
      undoLastAction();
      return { desc: '↶ Desfazer Executado', success: true };
    }

    if (/\b(trocar lados|inverter lados|inverter atletas|inverter)\b/.test(text)) {
      swapAthletes();
      return { desc: '⇆ Lados Trocados', success: true };
    }

    if (/\b(zerar placar|zerar luta|reiniciar placar|zerar tudo)\b/.test(text)) {
      ctrl('reset');
      setHistory([]);
      return { desc: '↺ Placar Zerado', success: true };
    }

    // 2. Identificação do Atleta (Target)
    // No português do Brasil, o reconhecimento de voz ouve "pro A" como "pro ar", "para o ar", "ao ar", "no ar", "o ar", etc.
    const regexA = /\b(azul|faixa azul|atleta azul|lutador azul|pro ar|para o ar|pra o ar|ao ar|no ar|do ar|o ar|pro a|para o a|pra o a|ao a|no a|do a|atleta a|lutador a|letra a|atleta ar|lutador ar|letra ar)\b/;
    const regexB = /\b(branco|faixa branca|atleta branco|lutador branco|vermelho|faixa vermelha|atleta vermelho|lutador vermelho|pro be|pro b|pro bê|para o be|para o b|ao be|ao b|no be|no b|do be|do b|atleta be|atleta b|lutador be|lutador b|letra be|letra b)\b/;

    let target = null;
    const hasA = regexA.test(text) || (nameA && text.includes(nameA));
    const hasB = regexB.test(text) || (nameB && text.includes(nameB));

    if (hasA && !hasB) target = 'atletaA';
    else if (hasB && !hasA) target = 'atletaB';
    else if (/\b(ar|a)$/.test(text)) target = 'atletaA';
    else if (/\b(be|b)$/.test(text)) target = 'atletaB';

    if (!target) return null;

    const label = target === 'atletaA' ? 'Azul' : 'Branco';

    // 3. Subtração / Retirada de pontos
    if (/\b(menos dois|menos 2|retirar dois|retirar 2|tirar dois|tirar 2|tira dois|tira 2|menos duas)\b/.test(text)) {
      addScore(target, 'pontos', -2);
      return { desc: `-2 Pontos para ${label}`, target, success: true };
    }
    if (/\b(menos tres|menos três|menos 3|retirar tres|retirar três|retirar 3|tirar tres|tirar três|tirar 3)\b/.test(text)) {
      addScore(target, 'pontos', -3);
      return { desc: `-3 Pontos para ${label}`, target, success: true };
    }
    if (/\b(menos quatro|menos 4|retirar quatro|retirar 4|tirar quatro|tirar 4)\b/.test(text)) {
      addScore(target, 'pontos', -4);
      return { desc: `-4 Pontos para ${label}`, target, success: true };
    }
    if (/\b(menos um|menos 1|retirar um|retirar 1|tirar um ponto|menos um ponto)\b/.test(text)) {
      addScore(target, 'pontos', -1);
      return { desc: `-1 Ponto para ${label}`, target, success: true };
    }
    if (/\b(retirar vantagem|tirar vantagem|tira vantagem|menos vantagem|desvantagem)\b/.test(text)) {
      addScore(target, 'vantagem', -1);
      return { desc: `-1 Vantagem para ${label}`, target, success: true };
    }
    if (/\b(retirar punicao|retirar punição|tirar punicao|tirar punição|tira punicao|menos punicao|menos punição)\b/.test(text)) {
      addScore(target, 'penalidade', -1);
      return { desc: `-1 Punição para ${label}`, target, success: true };
    }

    // 4. Pontuações positivas & Golpes de Jiu-Jitsu
    // 4 Pontos: Montada ou Costas
    if (/\b(quatro pontos|4 pontos|mais quatro|mais 4|montada|montou|costas|pegada de costas|pegou as costas|quatro)\b/.test(text)) {
      addScore(target, 'pontos', 4);
      const golpe = text.includes('mont') ? ' (Montada)' : text.includes('costas') ? ' (Costas)' : '';
      return { desc: `+4 Pontos para ${label}${golpe}`, target, success: true };
    }

    // 3 Pontos: Passagem de Guarda
    if (/\b(tres pontos|três pontos|3 pontos|mais tres|mais três|mais 3|passagem de guarda|passagem|passou a guarda|passou|tres|três)\b/.test(text)) {
      addScore(target, 'pontos', 3);
      const golpe = text.includes('pass') ? ' (Passagem de Guarda)' : '';
      return { desc: `+3 Pontos para ${label}${golpe}`, target, success: true };
    }

    // 2 Pontos: Queda, Raspagem, Joelho na barriga
    if (/\b(dois pontos|2 pontos|mais dois|mais 2|queda|derrubou|raspagem|raspou|joelho na barriga|joelho|dois)\b/.test(text)) {
      addScore(target, 'pontos', 2);
      const golpe = text.includes('queda') || text.includes('derrub') ? ' (Queda)' :
                    text.includes('rasp') ? ' (Raspagem)' :
                    text.includes('joelho') ? ' (Joelho na Barriga)' : '';
      return { desc: `+2 Pontos para ${label}${golpe}`, target, success: true };
    }

    // Vantagem
    if (/\b(vantagem|uma vantagem|1 vantagem|mais vantagem|ponto de vantagem)\b/.test(text)) {
      addScore(target, 'vantagem', 1);
      return { desc: `+1 Vantagem para ${label}`, target, success: true };
    }

    // Punição / Penalidade
    if (/\b(punicao|punição|uma punicao|uma punição|falta|uma falta|penalidade|penalizacao|penalização|shido)\b/.test(text)) {
      addScore(target, 'penalidade', 1);
      return { desc: `+1 Punição para ${label}`, target, success: true };
    }

    return null;
  }, [addScore, ctrl, swapAthletes, undoLastAction]);

  // ============================================================
  // MOTOR DE ESCUTA CONTÍNUA (SPEECH TO TEXT PARA ÁRBITRO)
  // ============================================================
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const currentLive = (interim || final).trim();
      if (currentLive) {
        setLiveSpeechText(currentLive);
      }

      const textToProcess = (final || interim).trim();
      if (textToProcess) {
        const cmdResult = parseRefereeVoiceCommand(textToProcess);
        if (cmdResult && cmdResult.success) {
          const now = Date.now();
          // Debounce de 1.1s para não duplicar na mesma fala
          if (now - lastCmdTimeRef.current > 1100) {
            lastCmdTimeRef.current = now;
            playChime(true);
            try { navigator.vibrate?.([70, 40, 70]); } catch {}
            setLastExecutedCmd(cmdResult.desc);
            setLiveSpeechText('');

            if (cmdResult.target === 'atletaA') {
              setHighlightA(true);
              setTimeout(() => setHighlightA(false), 1400);
            } else if (cmdResult.target === 'atletaB') {
              setHighlightB(true);
              setTimeout(() => setHighlightB(false), 1400);
            }
          }
        }
      }
    };

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // Auto-restart contínuo para o árbitro enquanto shouldListenRef for true
      if (shouldListenRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 220);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
        flash('Microfone bloqueado. Permita o acesso ao microfone.');
      }
      // 'no-speech' e 'network' acontecem naturalmente em silêncio e o onend reinicia
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try { recognition.abort(); } catch {}
    };
  }, [parseRefereeVoiceCommand]);

  const toggleRefereeVoice = () => {
    if (!voiceSupported) {
      flash('Navegador sem suporte a Speech-to-Text.');
      return;
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListeningRef.current) {
      shouldListenRef.current = false;
      try { recognition.stop(); } catch {}
      setIsListening(false);
      flash('Microfone do árbitro pausado ⏸');
    } else {
      shouldListenRef.current = true;
      try {
        recognition.start();
        setIsListening(true);
        flash('Microfone do árbitro ativo! Escutando continuamente... 🎙️');
      } catch (err) {
        flash('Iniciando microfone...');
      }
    }
  };

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

      {/* PAINEL DE COMANDOS DE VOZ DO ÁRBITRO (SPEECH TO TEXT CONTÍNUO) */}
      <section className="referee-voice-bar">
        <div className="referee-bar-header">
          <div className="referee-status-pill">
            <span className={`referee-dot ${isListening ? 'referee-dot--live' : ''}`}></span>
            <span className="referee-status-text">
              {isListening ? 'ÁRBITRO POR VOZ ATIVO (ESCUTA CONTÍNUA)' : 'VOZ DO ÁRBITRO PAUSADA'}
            </span>
          </div>

          <button
            className={`btn-referee-toggle ${isListening ? 'active' : ''}`}
            onClick={toggleRefereeVoice}
            title={isListening ? 'Pausar escuta do microfone' : 'Ativar escuta contínua'}
          >
            <span className="mic-ico">{isListening ? '⏸ Pausar Voz' : '🎙️ Ativar Voz Contínua'}</span>
          </button>
        </div>

        {/* VISOR SPEECH-TO-TEXT EM TEMPO REAL */}
        <div className="referee-stt-visor">
          {lastExecutedCmd ? (
            <div className="stt-executed-badge">
              <span className="stt-check">✓</span>
              <span className="stt-cmd-text">{lastExecutedCmd}</span>
            </div>
          ) : null}

          <div className="stt-live-box">
            <span className="stt-label">{isListening ? 'OUVINDO:' : 'DICA:'}</span>
            <span className="stt-speech-text">
              {isListening && liveSpeechText
                ? `"${liveSpeechText}"`
                : 'Fale: "dois pontos azul", "queda", "raspagem", "montada", "combate", "parou"...'}
            </span>
          </div>
        </div>
      </section>

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
        <div className={`tv-clone-row tv-clone-row--a ${highlightA ? 'highlight-athlete' : ''}`}>
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
        <div className={`tv-clone-row tv-clone-row--b ${highlightB ? 'highlight-athlete' : ''}`}>
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
