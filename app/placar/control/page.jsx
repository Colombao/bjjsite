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

// Áudio sintético para confirmação de comando de voz
const playChime = (success = true) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
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
  const [activeTab, setActiveTab] = useState('placar'); // 'placar' | 'spotify'

  // Horário real
  const [wallClock, setWallClock] = useState('');

  // Modais de edição
  const [editModal, setEditModal] = useState({ open: false, athlete: 'atletaA', nome: '', team: '' });
  const [timeModal, setTimeModal] = useState(false);

  // Módulo de Voz
  const [isListening, setIsListening] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [lastVoiceCmd, setLastVoiceCmd] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [highlightA, setHighlightA] = useState(false);
  const [highlightB, setHighlightB] = useState(false);

  // Spotify
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyName, setSpotifyName] = useState('');

  const connRef = useRef(null);
  const recognitionRef = useRef(null);
  const continuousRef = useRef(true);
  const isListeningRef = useRef(false);
  const matchRef = useRef(match);
  const runningRef = useRef(running);

  useEffect(() => {
    matchRef.current = match;
    runningRef.current = running;
  }, [match, running]);

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

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
                setMatch((prev) => {
                  // Se o modal de edição estiver aberto, preserva os dados que o usuário está digitando
                  return msg.match;
                });
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
    try { navigator.vibrate?.(40); } catch {}
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

  // ==========================================
  // PARSER DE COMANDOS DE VOZ EM PORTUGUÊS (BJJ)
  // Robusto contra variações fonéticas ("ar", "r", "ah", "be", etc.)
  // ==========================================
  const parseVoiceCommand = useCallback((rawText) => {
    const text = rawText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .trim();

    if (!text) return null;

    const currentMatch = matchRef.current;
    const nameA = (currentMatch.atletaA?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nameB = (currentMatch.atletaB?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Comandos de Tempo / Gerais primeiro
    if (/\b(iniciar luta|iniciar tempo|comecar luta|comecar|valendo|combate|soltar tempo|iniciar|soltar)\b/.test(text)) {
      if (!runningRef.current) ctrl('startPause');
      return { desc: '▶ Iniciar Luta', success: true };
    }
    if (/\b(pausar luta|parar luta|pausar tempo|parar tempo|parou|tempo|pause|pausa|para o tempo)\b/.test(text)) {
      if (runningRef.current) ctrl('startPause');
      return { desc: '⏸ Pausar Luta', success: true };
    }
    if (/\b(zerar placar|zerar luta|zerar tudo|reiniciar placar|zerar)\b/.test(text)) {
      ctrl('reset');
      return { desc: '↺ Placar Zerado', success: true };
    }
    if (/\b(trocar lados|inverter atletas|inverter lados|trocar)\b/.test(text)) {
      swapAthletes();
      return { desc: '⇆ Lados Trocados', success: true };
    }

    // 2. Identificação fonética do Atleta A e B
    // No português do Brasil, o reconhecimento de voz ouve "pro A" como "pro ar", "para o ar", "o ar", etc.
    const regexA = /\b(pro ar|para o ar|pra o ar|pro a|para o a|pra o a|ao ar|ao a|no ar|no a|do ar|do a|o ar|lutador ar|lutador a|atleta ar|atleta a|lutadora ar|lutadora a|letra a|letra ar|azul|atleta azul|lutador azul|faixa azul)\b/;
    const regexB = /\b(pro be|pro b|pro beh|pro bê|para o be|para o b|pra o be|pra o b|ao be|ao b|no be|no b|do be|do b|o be|o b|lutador be|lutador b|atleta be|atleta b|lutadora be|lutadora b|letra be|letra b|branco|faixa branca|atleta branco|lutador branco|vermelho|atleta vermelho|lutador vermelho)\b/;

    let target = null;
    const matchesA = regexA.test(text) || (nameA.length > 2 && text.includes(nameA));
    const matchesB = regexB.test(text) || (nameB.length > 2 && text.includes(nameB));

    if (matchesA && !matchesB) target = 'atletaA';
    else if (matchesB && !matchesA) target = 'atletaB';
    else if (/\b(ar|a)$/.test(text)) target = 'atletaA';
    else if (/\b(be|b)$/.test(text)) target = 'atletaB';

    if (!target) {
      return null;
    }

    const athleteLabel = target === 'atletaA' ? 'Lutador A (Azul)' : 'Lutador B (Branco)';

    // 3. Subtração de pontos
    if (/\b(retirar 2|retirar dois|tirar 2|tirar dois|menos 2|menos dois|menos duas)\b/.test(text)) {
      addScore(target, 'pontos', -2);
      return { desc: `-2 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 3|retirar tres|tirar 3|tirar tres|menos 3|menos tres)\b/.test(text)) {
      addScore(target, 'pontos', -3);
      return { desc: `-3 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 4|retirar quatro|tirar 4|tirar quatro|menos 4|menos quatro)\b/.test(text)) {
      addScore(target, 'pontos', -4);
      return { desc: `-4 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 1|retirar um|tirar 1|tirar um|menos 1|menos um|menos uma)\b/.test(text)) {
      addScore(target, 'pontos', -1);
      return { desc: `-1 ponto para ${athleteLabel}`, target, success: true };
    }

    // 4. Vantagem
    if (/\b(desvantagem|menos vantagem|retirar vantagem|tirar vantagem|menos uma vantagem)\b/.test(text)) {
      addScore(target, 'vantagem', -1);
      return { desc: `-1 Vantagem para ${athleteLabel}`, target, success: true };
    }
    if (/\b(vantagem|uma vantagem|mais uma vantagem|dar vantagem|vantagens)\b/.test(text)) {
      addScore(target, 'vantagem', 1);
      return { desc: `+1 Vantagem para ${athleteLabel}`, target, success: true };
    }

    // 5. Punição
    if (/\b(retirar punicao|tirar punicao|menos punicao|retirar falta|tirar falta|retirar penalidade)\b/.test(text)) {
      addScore(target, 'penalidade', -1);
      return { desc: `-1 Punição para ${athleteLabel}`, target, success: true };
    }
    if (/\b(punicao|uma punicao|penalidade|falta|dar punicao|dar falta|punições)\b/.test(text)) {
      addScore(target, 'penalidade', 1);
      return { desc: `+1 Punição para ${athleteLabel}`, target, success: true };
    }

    // 6. Adição de pontos
    if (/\b(dois pontos|2 pontos|mais dois|mais 2|queda|raspagem|joelho|joelho na barriga)\b/.test(text)) {
      addScore(target, 'pontos', 2);
      return { desc: `+2 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(tres pontos|3 pontos|mais tres|mais 3|passagem de guarda|passagem|passou)\b/.test(text)) {
      addScore(target, 'pontos', 3);
      return { desc: `+3 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(quatro pontos|4 pontos|mais quatro|mais 4|montada|costas|pegada de costas|montou|pegou as costas)\b/.test(text)) {
      addScore(target, 'pontos', 4);
      return { desc: `+4 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(um ponto|1 ponto|mais um ponto|mais 1)\b/.test(text)) {
      addScore(target, 'pontos', 1);
      return { desc: `+1 ponto para ${athleteLabel}`, target, success: true };
    }

    return null;
  }, [addScore, ctrl, swapAthletes]);

  // Inicializa Web Speech API
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const last = e.results.length - 1;
      const text = e.results[last][0].transcript;
      setTranscript(`"${text}"`);

      const result = parseVoiceCommand(text);
      if (result && result.success) {
        setLastVoiceCmd(result.desc);
        playChime(true);
        flash(`🎙️ ${result.desc}`);

        if (result.target === 'atletaA') {
          setHighlightA(true);
          setTimeout(() => setHighlightA(false), 800);
        } else if (result.target === 'atletaB') {
          setHighlightB(true);
          setTimeout(() => setHighlightB(false), 800);
        }
      } else {
        setLastVoiceCmd(`Não reconhecido: "${text}"`);
        playChime(false);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setLastVoiceCmd(`Aviso: ${e.error}`);
      }
    };

    recognition.onend = () => {
      if (continuousRef.current && isListeningRef.current) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch {}
    };
  }, [parseVoiceCommand]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch {}
      flash('Microfone desligado');
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      setTranscript('Ouvindo... Fale o comando.');
      try {
        recognitionRef.current.start();
        flash('🎙️ Microfone ativado — diga o comando!');
      } catch (e) {
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  // Enviar Playlist do Spotify para a TV
  const sendSpotifyPlaylist = (url, name) => {
    const finalUrl = (url || spotifyUrl).trim();
    if (!finalUrl) {
      flash('Cole o link da playlist do Spotify');
      return;
    }
    const finalName = (name || spotifyName).trim();
    send({ kind: 'playlist', url: finalUrl, name: finalName });
    flash('🎵 Playlist enviada para a TV!');
    setSpotifyUrl('');
    setSpotifyName('');
  };

  // Abrir Modal de Edição de Atleta
  const openEditAthlete = (athleteKey) => {
    setEditModal({
      open: true,
      athlete: athleteKey,
      nome: match[athleteKey]?.nome || '',
      team: match[athleteKey]?.team || '',
    });
  };

  // Salvar Edição de Atleta (resolve o bug de digitação letra por letra)
  const saveEditAthlete = () => {
    if (!editModal.open) return;
    const { athlete, nome, team } = editModal;
    const finalNome = nome.trim() || (athlete === 'atletaA' ? 'ATLETA A' : 'ATLETA B');
    const finalTeam = team.trim() || (athlete === 'atletaA' ? 'CT HEISHIKAN' : 'VISITANTE');

    setMatch((prev) => ({
      ...prev,
      [athlete]: { ...prev[athlete], nome: finalNome, team: finalTeam },
    }));
    ctrl('set', { athlete, field: 'nome', value: finalNome });
    ctrl('set', { athlete, field: 'team', value: finalTeam });
    setEditModal({ open: false, athlete: 'atletaA', nome: '', team: '' });
    flash('Atleta salvo na TV ✓');
  };

  const statusTxt = {
    'no-id': 'Escaneie o QR code da TV com a câmera do celular.',
    connecting: 'Conectando à TV…',
    connected: '✓ Conectado à TV em tempo real',
    closed: 'Conexão encerrada.',
    error: 'Erro de conexão.',
  }[status];

  const on = status === 'connected';

  return (
    <div className="control-container">
      {/* TOAST FLUTUANTE */}
      {toast && <div className="control-toast">{toast}</div>}

      {/* CABEÇALHO */}
      <header className="control-header">
        <div className="control-brand">
          <img src="/img/logo-heishikan.png" alt="CT Heishikan" width="36" height="36" />
          <div>
            <h1>PLACAR JIU-JITSU</h1>
            <p className={`conn-status ${on ? 'conn-status--ok' : ''}`}>{statusTxt}</p>
          </div>
          {wallClock && <div className="ctrl-wallclock">{wallClock}</div>}
        </div>

        {/* ABAS */}
        <div className="control-tabs">
          <button
            className={`tab-btn ${activeTab === 'placar' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('placar')}
          >
            🥋 Placar TV & Voz
          </button>
          <button
            className={`tab-btn ${activeTab === 'spotify' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('spotify')}
          >
            🎵 Spotify na TV
          </button>
        </div>
      </header>

      {/* ABA 1: PLACAR INTERATIVO (IGUAL À TV) */}
      {activeTab === 'placar' && (
        <main className="placar-tab-body">
          {/* PAINEL DE VOZ */}
          <section className="voice-bar">
            <div className="voice-bar-left">
              <button
                disabled={!on}
                onClick={toggleVoice}
                className={`btn-voice-toggle ${isListening ? 'listening' : ''}`}
              >
                <span className="mic-icon">{isListening ? '⏹' : '🎤'}</span>
                <span>{isListening ? 'Ouvindo... (Toque p/ parar)' : 'Ativar Pontuação por Voz'}</span>
              </button>
              <label className="toggle-continuous" title="Deixa o celular ouvindo continuamente">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                />
                <span>Contínuo</span>
              </label>
            </div>

            {/* Transcrição da Voz */}
            {(transcript || lastVoiceCmd) && (
              <div className="voice-live-card">
                {transcript && <div className="transcript-line">{transcript}</div>}
                {lastVoiceCmd && <div className="last-cmd-line">{lastVoiceCmd}</div>}
              </div>
            )}
          </section>

          {/* O PLACAR VISUAL DA TV (INTERATIVO) */}
          <section className="tv-scoreboard">
            {/* LINHA ATLETA A (AZUL) */}
            <div className={`tv-sb-row tv-sb-row--a ${highlightA ? 'highlight' : ''}`}>
              {/* Caixa do Nome (Azul) */}
              <div
                className="tv-cell-name tv-cell-name--a"
                onClick={() => openEditAthlete('atletaA')}
                title="Toque para editar o nome"
              >
                <div className="name-box">
                  <span className="nome-val">{match.atletaA.nome}</span>
                  <span className="team-val">{match.atletaA.team}</span>
                </div>
                <span className="edit-badge">✏️ Editar</span>
              </div>

              {/* Caixa Verde: PONTOS */}
              <div className="tv-cell-score tv-cell-score--pts">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaA', 'pontos', 2)}
                  title="Toque no número para dar +2 pontos"
                >
                  <span className="score-num">{match.atletaA.pontos}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaA', 'pontos', 2)}>+2</button>
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaA', 'pontos', 3)}>+3</button>
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaA', 'pontos', 4)}>+4</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaA.pontos === 0}
                    onClick={() => addScore('atletaA', 'pontos', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>

              {/* Caixa Amarela: VANTAGEM */}
              <div className="tv-cell-score tv-cell-score--adv">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaA', 'vantagem', 1)}
                  title="Toque no número para dar +1 vantagem"
                >
                  <span className="score-num">{match.atletaA.vantagem}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--adv" onClick={() => addScore('atletaA', 'vantagem', 1)}>+1</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaA.vantagem === 0}
                    onClick={() => addScore('atletaA', 'vantagem', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>

              {/* Caixa Vermelha: PUNIÇÃO */}
              <div className="tv-cell-score tv-cell-score--pen">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaA', 'penalidade', 1)}
                  title="Toque no número para dar +1 punição"
                >
                  <span className="score-num">{match.atletaA.penalidade}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--pen" onClick={() => addScore('atletaA', 'penalidade', 1)}>+1</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaA.penalidade === 0}
                    onClick={() => addScore('atletaA', 'penalidade', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>
            </div>

            {/* LINHA ATLETA B (BRANCO) */}
            <div className={`tv-sb-row tv-sb-row--b ${highlightB ? 'highlight' : ''}`}>
              {/* Caixa do Nome (Branco) */}
              <div
                className="tv-cell-name tv-cell-name--b"
                onClick={() => openEditAthlete('atletaB')}
                title="Toque para editar o nome"
              >
                <div className="name-box">
                  <span className="nome-val">{match.atletaB.nome}</span>
                  <span className="team-val">{match.atletaB.team}</span>
                </div>
                <span className="edit-badge">✏️ Editar</span>
              </div>

              {/* Caixa Verde: PONTOS */}
              <div className="tv-cell-score tv-cell-score--pts">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaB', 'pontos', 2)}
                  title="Toque no número para dar +2 pontos"
                >
                  <span className="score-num">{match.atletaB.pontos}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaB', 'pontos', 2)}>+2</button>
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaB', 'pontos', 3)}>+3</button>
                  <button className="pill-btn pill-btn--pts" onClick={() => addScore('atletaB', 'pontos', 4)}>+4</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaB.pontos === 0}
                    onClick={() => addScore('atletaB', 'pontos', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>

              {/* Caixa Amarela: VANTAGEM */}
              <div className="tv-cell-score tv-cell-score--adv">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaB', 'vantagem', 1)}
                  title="Toque no número para dar +1 vantagem"
                >
                  <span className="score-num">{match.atletaB.vantagem}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--adv" onClick={() => addScore('atletaB', 'vantagem', 1)}>+1</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaB.vantagem === 0}
                    onClick={() => addScore('atletaB', 'vantagem', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>

              {/* Caixa Vermelha: PUNIÇÃO */}
              <div className="tv-cell-score tv-cell-score--pen">
                <div
                  className="score-touch-area"
                  onClick={() => addScore('atletaB', 'penalidade', 1)}
                  title="Toque no número para dar +1 punição"
                >
                  <span className="score-num">{match.atletaB.penalidade}</span>
                </div>
                <div className="score-pill-row">
                  <button className="pill-btn pill-btn--pen" onClick={() => addScore('atletaB', 'penalidade', 1)}>+1</button>
                  <button
                    className="pill-btn pill-btn--sub"
                    disabled={match.atletaB.penalidade === 0}
                    onClick={() => addScore('atletaB', 'penalidade', -1)}
                  >
                    −1
                  </button>
                </div>
              </div>
            </div>

            {/* LINHA DE BAIXO (TEMPO E BOTÃO INICIAR/PAUSAR) */}
            <div className="tv-sb-foot">
              <div
                className="tv-cell-time"
                onClick={() => setTimeModal(true)}
                title="Toque para mudar o tempo da luta"
              >
                <span className="time-val">{match.tempo}</span>
                <span className="time-hint">⏱ Ajustar Tempo</span>
              </div>

              <div
                className={`tv-cell-status ${running ? 'status--running' : 'status--stopped'}`}
                onClick={() => {
                  ctrl('startPause');
                  flash(running ? 'Pausado ⏸' : 'Iniciado ▶');
                }}
                title="Toque para Iniciar ou Pausar a luta"
              >
                <span className="status-label">{running ? 'LUTANDO' : 'INÍCIO'}</span>
                <span className="status-btn-text">{running ? '⏸ PAUSAR' : '▶ INICIAR LUTA'}</span>
              </div>
            </div>
          </section>

          {/* BOTÕES DE AÇÕES RÁPIDAS DE TATAME */}
          <div className="quick-actions-bar">
            <button className="quick-action-btn" onClick={swapAthletes} title="Inverter lados">
              ⇆ Trocar Lados
            </button>
            <button
              className="quick-action-btn quick-action-btn--reset"
              onClick={() => {
                if (window.confirm('Deseja realmente zerar todos os pontos e o cronômetro?')) {
                  ctrl('reset');
                  flash('Placar zerado ✓');
                }
              }}
            >
              ↺ Zerar Placar
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab('spotify')}>
              ♫ Spotify
            </button>
          </div>
        </main>
      )}

      {/* ABA 2: SPOTIFY & MÚSICA */}
      {activeTab === 'spotify' && (
        <div className="spotify-panel">
          <div className="spotify-card">
            <h3>🎵 Playlists Prontas para Treino BJJ</h3>
            <p className="spotify-sub">Toque para tocar instantaneamente na TV:</p>
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
            <h3>📱 Enviar Qualquer Playlist do seu Celular</h3>
            <p className="spotify-sub">Abra o Spotify no celular, clique em "Compartilhar" ➔ "Copiar Link" e cole aqui:</p>
            <div className="spotify-custom-form">
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="Cole o link ou ID da playlist (ex: open.spotify.com/playlist/...)"
                className="input-text"
              />
              <button
                disabled={!on}
                onClick={() => sendSpotifyPlaylist()}
                className="btn-send-spotify"
              >
                Tocar na TV ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR ATLETA (Resolve o bug de digitação letra por letra) */}
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
