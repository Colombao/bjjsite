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
];

export default function PlacarControl() {
  const [status, setStatus] = useState('connecting'); // no-id|connecting|connected|closed|error
  const [match, setMatch] = useState(DEFAULT_STATE);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('placar'); // 'placar' | 'spotify'

  // Voz
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
  const focusedRef = useRef(null);
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
                  const f = focusedRef.current;
                  if (!f) return msg.match;
                  const next = { ...msg.match };
                  if (f.athlete && f.field) {
                    next[f.athlete] = {
                      ...next[f.athlete],
                      [f.field]: prev[f.athlete]?.[f.field],
                    };
                  }
                  return next;
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

  const setField = (athlete, field, value) => {
    setMatch((prev) => ({
      ...prev,
      [athlete]: { ...prev[athlete], [field]: value },
    }));
    ctrl('set', { athlete, field, value });
  };

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

    // Identifica atleta
    let target = null;
    const matchesA = /\b(lutador a|atleta a|para o a|pro a|do a|no a|azul|atleta azul|lutador azul)\b/.test(text) ||
      (nameA.length > 2 && text.includes(nameA));
    const matchesB = /\b(lutador b|atleta b|para o b|pro b|do b|no b|vermelho|branco|atleta vermelho|lutador vermelho|atleta branco|lutador branco)\b/.test(text) ||
      (nameB.length > 2 && text.includes(nameB));

    if (matchesA && !matchesB) target = 'atletaA';
    else if (matchesB && !matchesA) target = 'atletaB';
    else if (/\b(o a|ao a|no a)\b/.test(text)) target = 'atletaA';
    else if (/\b(o b|ao b|no b)\b/.test(text)) target = 'atletaB';

    // 1. Comandos de Tempo / Gerais
    if (/\b(iniciar luta|iniciar tempo|comecar luta|comecar|valendo|combate|soltar tempo)\b/.test(text)) {
      if (!runningRef.current) ctrl('startPause');
      return { desc: '▶ Iniciar Luta', success: true };
    }
    if (/\b(pausar luta|parar luta|pausar tempo|parar tempo|parou|tempo|pause)\b/.test(text)) {
      if (runningRef.current) ctrl('startPause');
      return { desc: '⏸ Pausar Luta', success: true };
    }
    if (/\b(zerar placar|zerar luta|zerar tudo|reiniciar placar)\b/.test(text)) {
      ctrl('reset');
      return { desc: '↺ Placar Zerado', success: true };
    }
    if (/\b(trocar lados|inverter atletas|inverter lados)\b/.test(text)) {
      swapAthletes();
      return { desc: '⇆ Lados Trocados', success: true };
    }

    if (!target) {
      return null;
    }

    const athleteLabel = target === 'atletaA' ? 'Lutador A (Azul)' : 'Lutador B (Branco)';

    // 2. Pontos Subtração (-2, -3, -4, -1)
    if (/\b(retirar 2 pontos|retirar dois pontos|tirar 2 pontos|tirar dois pontos|menos 2 pontos|menos dois pontos|menos dois|menos 2)\b/.test(text)) {
      addScore(target, 'pontos', -2);
      return { desc: `-2 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 3 pontos|retirar tres pontos|tirar 3 pontos|tirar tres pontos|menos 3 pontos|menos tres pontos|menos tres|menos 3)\b/.test(text)) {
      addScore(target, 'pontos', -3);
      return { desc: `-3 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 4 pontos|retirar quatro pontos|tirar 4 pontos|tirar quatro pontos|menos 4 pontos|menos quatro pontos|menos quatro|menos 4)\b/.test(text)) {
      addScore(target, 'pontos', -4);
      return { desc: `-4 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(retirar 1 ponto|retirar um ponto|tirar 1 ponto|tirar um ponto|menos 1 ponto|menos um ponto|menos um)\b/.test(text)) {
      addScore(target, 'pontos', -1);
      return { desc: `-1 ponto para ${athleteLabel}`, target, success: true };
    }

    // 3. Vantagem Adição / Subtração
    if (/\b(desvantagem|menos vantagem|retirar vantagem|tirar vantagem|menos uma vantagem)\b/.test(text)) {
      addScore(target, 'vantagem', -1);
      return { desc: `-1 Vantagem para ${athleteLabel}`, target, success: true };
    }
    if (/\b(vantagem|uma vantagem|mais uma vantagem|dar vantagem)\b/.test(text)) {
      addScore(target, 'vantagem', 1);
      return { desc: `+1 Vantagem para ${athleteLabel}`, target, success: true };
    }

    // 4. Punição / Penalidade Adição / Subtração
    if (/\b(retirar punicao|tirar punicao|menos punicao|retirar falta|tirar falta|retirar penalidade)\b/.test(text)) {
      addScore(target, 'penalidade', -1);
      return { desc: `-1 Punição para ${athleteLabel}`, target, success: true };
    }
    if (/\b(punicao|uma punicao|penalidade|falta|dar punicao|dar falta)\b/.test(text)) {
      addScore(target, 'penalidade', 1);
      return { desc: `+1 Punição para ${athleteLabel}`, target, success: true };
    }

    // 5. Pontos Adição (+2, +3, +4, +1)
    if (/\b(dois pontos|2 pontos|mais dois pontos|mais 2|queda|raspagem|joelho na barriga)\b/.test(text)) {
      addScore(target, 'pontos', 2);
      return { desc: `+2 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(tres pontos|3 pontos|mais tres pontos|mais 3|passagem de guarda|passagem)\b/.test(text)) {
      addScore(target, 'pontos', 3);
      return { desc: `+3 pontos para ${athleteLabel}`, target, success: true };
    }
    if (/\b(quatro pontos|4 pontos|mais quatro pontos|mais 4|montada|costas|pegada de costas)\b/.test(text)) {
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
        setLastVoiceCmd(`Comando não reconhecido: "${text}"`);
        playChime(false);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setLastVoiceCmd(`Aviso: ${e.error}`);
      }
    };

    recognition.onend = () => {
      // Se estiver em modo contínuo, reinicia automaticamente para o tatame
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
      setTranscript('Ouvindo... Diga o comando.');
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

  const statusTxt = {
    'no-id': 'Escaneie o QR code da TV para abrir o controle com a sessão.',
    connecting: 'Conectando à TV…',
    connected: '✓ Conectado à TV — alterações aparecem na hora',
    closed: 'Conexão encerrada. Escaneie o QR de novo na TV.',
    error: 'Não foi possível conectar. Escaneie o QR de novo na TV.',
  }[status];

  const on = status === 'connected';

  // Bloco de Atleta com botões rápidos CBJJ
  const AthleteBlock = ({ id, title, highlight }) => {
    const isA = id === 'atletaA';
    return (
      <section className={`athlete-control ${isA ? 'athlete-a' : 'athlete-b'} ${highlight ? 'athlete--highlight' : ''}`}>
        <div className="athlete-title-bar">
          <h2>{title}</h2>
          <span className={`athlete-badge ${isA ? 'badge--blue' : 'badge--white'}`}>
            {isA ? 'Faixa Azul' : 'Branco / Vermelho'}
          </span>
        </div>

        <div className="input-group">
          <label>Nome do Lutador</label>
          <input
            type="text"
            value={match[id].nome}
            disabled={!on}
            maxLength={30}
            className="input-text"
            onFocus={() => { focusedRef.current = { athlete: id, field: 'nome' }; }}
            onBlur={() => { focusedRef.current = null; }}
            onChange={(e) => setField(id, 'nome', e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Equipe</label>
          <input
            type="text"
            value={match[id].team}
            disabled={!on}
            maxLength={30}
            className="input-text"
            onFocus={() => { focusedRef.current = { athlete: id, field: 'team' }; }}
            onBlur={() => { focusedRef.current = null; }}
            onChange={(e) => setField(id, 'team', e.target.value)}
          />
        </div>

        {/* Resumo dos pontos atuais */}
        <div className="score-summary-cards">
          <div className="sum-card sum-card--pts">
            <span className="sum-label">Pontos</span>
            <span className="sum-val">{match[id].pontos}</span>
          </div>
          <div className="sum-card sum-card--adv">
            <span className="sum-label">Vantagem</span>
            <span className="sum-val">{match[id].vantagem}</span>
          </div>
          <div className="sum-card sum-card--pen">
            <span className="sum-label">Punição</span>
            <span className="sum-val">{match[id].penalidade}</span>
          </div>
        </div>

        {/* BOTÕES RÁPIDOS CBJJ */}
        <div className="bjj-actions">
          <div className="bjj-action-group">
            <span className="bjj-group-label">Pontos CBJJ</span>
            <div className="bjj-btn-row">
              <button
                disabled={!on}
                onClick={() => addScore(id, 'pontos', 2)}
                className="btn-bjj btn-bjj--2"
                title="Queda, Raspagem ou Joelho na barriga (+2)"
              >
                <strong>+2</strong>
                <small>Queda / Rasp</small>
              </button>
              <button
                disabled={!on}
                onClick={() => addScore(id, 'pontos', 3)}
                className="btn-bjj btn-bjj--3"
                title="Passagem de guarda (+3)"
              >
                <strong>+3</strong>
                <small>Passagem</small>
              </button>
              <button
                disabled={!on}
                onClick={() => addScore(id, 'pontos', 4)}
                className="btn-bjj btn-bjj--4"
                title="Montada ou Pegada pelas costas (+4)"
              >
                <strong>+4</strong>
                <small>Montada / Costas</small>
              </button>
            </div>
            {/* Correção de pontos */}
            <div className="bjj-minus-row">
              {[-1, -2, -3, -4].map((delta) => (
                <button
                  key={delta}
                  disabled={!on || match[id].pontos === 0}
                  onClick={() => addScore(id, 'pontos', delta)}
                  className="btn-bjj-sub"
                  title={`Retirar ${Math.abs(delta)} pontos`}
                >
                  {delta}
                </button>
              ))}
            </div>
          </div>

          <div className="bjj-action-group bjj-action-group--split">
            {/* Vantagem */}
            <div className="bjj-subgroup">
              <span className="bjj-group-label">Vantagem</span>
              <div className="bjj-btn-duo">
                <button
                  disabled={!on}
                  onClick={() => addScore(id, 'vantagem', 1)}
                  className="btn-bjj btn-bjj--adv"
                >
                  +1 V
                </button>
                <button
                  disabled={!on || match[id].vantagem === 0}
                  onClick={() => addScore(id, 'vantagem', -1)}
                  className="btn-bjj-sub"
                >
                  −1 V
                </button>
              </div>
            </div>

            {/* Punição */}
            <div className="bjj-subgroup">
              <span className="bjj-group-label">Punição</span>
              <div className="bjj-btn-duo">
                <button
                  disabled={!on}
                  onClick={() => addScore(id, 'penalidade', 1)}
                  className="btn-bjj btn-bjj--pen"
                >
                  +1 P
                </button>
                <button
                  disabled={!on || match[id].penalidade === 0}
                  onClick={() => addScore(id, 'penalidade', -1)}
                  className="btn-bjj-sub"
                >
                  −1 P
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="control-container">
      {/* CABEÇALHO */}
      <header className="control-header">
        <div className="control-brand">
          <img src="/img/logo-heishikan.png" alt="CT Heishikan" width="36" height="36" />
          <div>
            <h1>Controle do Placar</h1>
            <p className={`conn-status ${on ? 'conn-status--ok' : ''}`}>{statusTxt}</p>
          </div>
        </div>

        {!on && status === 'no-id' && (
          <div className="conn-help-box">
            <p>
              Abra o placar na TV (em <strong>/placar/display</strong> ou no app Tatame TV) e escaneie o QR code com a câmera do celular.
            </p>
          </div>
        )}

        {/* ABAS */}
        <div className="control-tabs">
          <button
            className={`tab-btn ${activeTab === 'placar' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('placar')}
          >
            🥋 Placar & Voz
          </button>
          <button
            className={`tab-btn ${activeTab === 'spotify' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('spotify')}
          >
            🎵 Spotify & Treino
          </button>
        </div>
      </header>

      {/* ABA 1: PLACAR E COMANDO DE VOZ */}
      {activeTab === 'placar' && (
        <>
          {/* MÓDULO DE RECONHECIMENTO DE VOZ */}
          <section className="voice-panel">
            <div className="voice-header">
              <div className="voice-title">
                <h3>🎙️ Pontuar por Voz</h3>
                <span className="voice-badge">Tatame Hands-Free</span>
              </div>
              <label className="voice-continuous-toggle">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                />
                <span>Modo Contínuo</span>
              </label>
            </div>

            {voiceSupported ? (
              <>
                <div className="voice-action-row">
                  <button
                    disabled={!on}
                    onClick={toggleVoice}
                    className={`btn-voice ${isListening ? 'btn-voice--active' : ''}`}
                  >
                    <span className="voice-icon">{isListening ? '⏹' : '🎙️'}</span>
                    <span>{isListening ? 'Ouvindo... Toque para Parar' : 'Ativar Microfone por Voz'}</span>
                  </button>
                </div>

                {/* Status da fala */}
                <div className="voice-feedback">
                  {transcript && <p className="voice-transcript">{transcript}</p>}
                  {lastVoiceCmd && <p className="voice-last-cmd">✓ {lastVoiceCmd}</p>}
                  {!transcript && !lastVoiceCmd && (
                    <p className="voice-hint">
                      Exemplos: <em>"dois pontos para o lutador A"</em>, <em>"retirar 2 pontos do A"</em>, <em>"desvantagem para o lutador A"</em>, <em>"punição para o B"</em>.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="voice-unsupported">
                Seu navegador não suporta reconhecimento de voz direto. Use o Google Chrome ou Safari no celular.
              </p>
            )}
          </section>

          {/* CONTEÚDO DOS ATLETAS */}
          <div className={`control-content ${!on ? 'control-content--dim' : ''}`}>
            <AthleteBlock id="atletaA" title="Atleta A" highlight={highlightA} />
            <AthleteBlock id="atletaB" title="Atleta B" highlight={highlightB} />

            {/* SEÇÃO DO CRONÔMETRO */}
            <section className="timer-control">
              <div className="timer-head-row">
                <h2>Luta</h2>
                <button
                  disabled={!on}
                  onClick={swapAthletes}
                  className="btn-swap-sides"
                  title="Trocar lados dos atletas"
                >
                  ⇆ Inverter Lados
                </button>
              </div>

              <div className="timer-display">
                <div className="time-value">{match.tempo}</div>
                <div className="time-buttons">
                  {[3, 5, 6, 8, 10].map((min) => (
                    <button
                      key={min}
                      disabled={!on}
                      onClick={() => {
                        ctrl('timerSet', { minutes: min });
                        flash(`${min} min ✓`);
                      }}
                      className={`time-btn ${match.tempo === `${String(min).padStart(2, '0')}:00` ? 'active' : ''}`}
                    >
                      {min}min
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-buttons">
                <button
                  disabled={!on}
                  onClick={() => {
                    ctrl('startPause');
                    flash(running ? 'Pausado ✓' : 'Iniciado ✓');
                  }}
                  className={`btn-large ${running ? 'btn-pause' : 'btn-play'}`}
                >
                  {running ? '⏸ Pausar Luta' : '▶ Iniciar Luta'}
                </button>
              </div>

              <div className="status-buttons">
                <label>Status da Luta</label>
                <div className="button-group-status">
                  {['INÍCIO', 'DURANTE', 'FINAL'].map((s) => (
                    <button
                      key={s}
                      disabled={!on}
                      onClick={() => {
                        ctrl('status', { value: s });
                        flash(`Status: ${s}`);
                      }}
                      className={`status-btn ${match.statusLuta === s ? 'active' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!on}
                onClick={() => {
                  ctrl('reset');
                  flash('Placar zerado ✓');
                }}
                className="btn-reset"
              >
                Zerar Placar
              </button>
            </section>
          </div>
        </>
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
            <h3>📱 Enviar Qualquer Playlist do seu Spotify</h3>
            <p className="spotify-sub">
              No seu celular: abra a playlist no app do Spotify → toque em <strong>Compartilhar</strong> → <strong>Copiar Link</strong> → cole abaixo:
            </p>

            <div className="input-group">
              <label>Nome do Atalho (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Treino das 19h"
                value={spotifyName}
                maxLength={30}
                className="input-text"
                onChange={(e) => setSpotifyName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Link da Playlist do Spotify</label>
              <textarea
                rows={2}
                placeholder="Cole o link aqui (https://open.spotify.com/playlist/...)"
                value={spotifyUrl}
                className="input-text input-textarea"
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
            </div>

            <div className="spotify-action-row">
              <button
                type="button"
                className="btn-paste"
                onClick={async () => {
                  try {
                    const clip = await navigator.clipboard.readText();
                    if (clip) setSpotifyUrl(clip);
                  } catch {}
                }}
              >
                📋 Colar
              </button>
              <button
                type="button"
                disabled={!on || !spotifyUrl.trim()}
                className="btn-send-spotify"
                onClick={() => sendSpotifyPlaylist()}
              >
                Enviar para a TV
              </button>
            </div>
          </div>

          <div className="spotify-card">
            <h3>🔑 Dica para Músicas Completas</h3>
            <p className="spotify-tip">
              Para as músicas tocarem completas sem a prévia de 30 segundos, faça login com sua conta Spotify no navegador da TV ou abra o app Spotify instalado na TV!
            </p>
          </div>
        </div>
      )}

      {toast && <div className="pc-toast">{toast}</div>}
    </div>
  );
}
