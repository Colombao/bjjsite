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

const parseSpotifyUrl = (str) => {
  const s = String(str || '').trim();
  const m = s.match(/(playlist|album|track|artist)[/:]([A-Za-z0-9]{15,})/);
  if (m) return { type: m[1], id: m[2] };
  if (/^[A-Za-z0-9]{20,}$/.test(s)) return { type: 'playlist', id: s };
  return null;
};

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
  const [fixMode, setFixMode] = useState(false);

  // Spotify
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const connRef = useRef(null);
  const matchRef = useRef(match);
  const runningRef = useRef(running);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const shouldListenRef = useRef(false); // Flag para escuta contínua de árbitro
  const lastCmdTimeRef = useRef(0);
  const lastExecutedKeyRef = useRef('');
  const lastExecutedTextRef = useRef('');

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
          conn.on('open', () => {
            setStatus('connected');
            try { conn.send({ kind: 'ping' }); } catch {}
          });
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

  // Clique interativo na célula do placar (no modo normal soma, no modo corrigir subtrai)
  const handleCellClick = useCallback((athlete, field) => {
    if (fixMode) {
      const delta = field === 'pontos' ? -2 : -1;
      addScore(athlete, field, delta);
    } else {
      const delta = field === 'pontos' ? 2 : 1;
      addScore(athlete, field, delta);
    }
  }, [fixMode, addScore]);

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

  // Zerar apenas as pontuações (mantém nomes e tempo)
  const resetScores = useCallback(() => {
    setMatch((prev) => ({
      ...prev,
      atletaA: { ...prev.atletaA, pontos: 0, vantagem: 0, penalidade: 0 },
      atletaB: { ...prev.atletaB, pontos: 0, vantagem: 0, penalidade: 0 },
    }));
    setHistory([]);
    ctrl('resetScore');
    try { navigator.vibrate?.(60); } catch {}
    flash('Pontuações zeradas (0 x 0) ✓');
  }, [ctrl]);

  // Reiniciar luta completa (zera pontuações e reinicia o tempo)
  const resetAll = useCallback(() => {
    setMatch((prev) => ({
      ...prev,
      atletaA: { ...prev.atletaA, pontos: 0, vantagem: 0, penalidade: 0 },
      atletaB: { ...prev.atletaB, pontos: 0, vantagem: 0, penalidade: 0 },
      statusLuta: 'INÍCIO',
    }));
    setRunning(false);
    setHistory([]);
    ctrl('reset');
    try { navigator.vibrate?.([60, 60, 60]); } catch {}
    flash('Placar e tempo reiniciados ✓');
  }, [ctrl]);

  // Iniciar / Pausar cronômetro
  const toggleStartPause = useCallback(() => {
    setRunning((prev) => !prev);
    ctrl('startPause');
    flash(!runningRef.current ? 'Iniciado ▶' : 'Pausado ⏸');
    try { navigator.vibrate?.(50); } catch {}
  }, [ctrl]);

  // ============================================================
  // PARSER DE COMANDOS DE ÁRBITRO DE JIU-JITSU (CBJJ / IBJJF)
  // Função PURA: analisa o texto e retorna a instrução sem mutar estado
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

    // 1. Comandos de tempo e controle da luta
    if (/\b(combate|valendo|iniciar luta|iniciar tempo|soltar tempo|solta o tempo|comecar|luta|tempo rodando)\b/.test(text)) {
      return { type: 'control', action: 'start', desc: '▶ Combate! (Luta Iniciada)' };
    }

    if (/\b(parou|tempo|para o tempo|parar tempo|pausar luta|pausa|pausar|stop)\b/.test(text)) {
      return { type: 'control', action: 'pause', desc: '⏸ Parou! (Luta Pausada)' };
    }

    if (/\b(desfazer|desfaz|anular ponto|anular|cancela o ponto)\b/.test(text)) {
      return { type: 'undo', desc: '↶ Desfazer Executado' };
    }

    if (/\b(trocar lados|inverter lados|inverter atletas|inverter)\b/.test(text)) {
      return { type: 'swap', desc: '⇆ Lados Trocados' };
    }

    // Zerar apenas pontos
    if (/\b(zerar pontos|zerar pontuacao|zerar pontuação|limpar pontos|zerar ponto|limpar pontuacao)\b/.test(text)) {
      return { type: 'resetScore', desc: '↺ Pontuações Zeradas (0 x 0)' };
    }

    // Zerar placar / reiniciar luta completa
    if (/\b(zerar placar|zerar luta|reiniciar placar|reiniciar luta|reiniciar|zerar tudo|novo combate)\b/.test(text)) {
      return { type: 'resetAll', desc: '↺ Placar e Luta Reiniciados' };
    }

    // 2. Identificação do Atleta (Target)
    const currentMatch = matchRef.current;
    const rawNameA = (currentMatch.atletaA?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const rawNameB = (currentMatch.atletaB?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const nameA = rawNameA.length >= 3 && !['atleta', 'lutador', 'faixa'].includes(rawNameA) ? rawNameA : '';
    const nameB = rawNameB.length >= 3 && !['atleta', 'lutador', 'faixa'].includes(rawNameB) ? rawNameB : '';

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
      return { type: 'score', target, field: 'pontos', delta: -2, desc: `-2 Pontos para ${label}` };
    }
    if (/\b(menos tres|menos três|menos 3|retirar tres|retirar três|retirar 3|tirar tres|tirar três|tirar 3)\b/.test(text)) {
      return { type: 'score', target, field: 'pontos', delta: -3, desc: `-3 Pontos para ${label}` };
    }
    if (/\b(menos quatro|menos 4|retirar quatro|retirar 4|tirar quatro|tirar 4)\b/.test(text)) {
      return { type: 'score', target, field: 'pontos', delta: -4, desc: `-4 Pontos para ${label}` };
    }
    if (/\b(menos um|menos 1|retirar um|retirar 1|tirar um ponto|menos um ponto)\b/.test(text)) {
      return { type: 'score', target, field: 'pontos', delta: -1, desc: `-1 Ponto para ${label}` };
    }
    if (/\b(retirar vantagem|tirar vantagem|tira vantagem|menos vantagem|desvantagem)\b/.test(text)) {
      return { type: 'score', target, field: 'vantagem', delta: -1, desc: `-1 Vantagem para ${label}` };
    }
    if (/\b(retirar punicao|retirar punição|tirar punicao|tirar punição|tira punicao|menos punicao|menos punição)\b/.test(text)) {
      return { type: 'score', target, field: 'penalidade', delta: -1, desc: `-1 Punição para ${label}` };
    }

    // 4. Pontuações positivas & Golpes de Jiu-Jitsu
    // 4 Pontos: Montada ou Costas
    if (/\b(quatro pontos|4 pontos|mais quatro|mais 4|montada|montou|costas|pegada de costas|pegou as costas|quatro)\b/.test(text)) {
      const golpe = text.includes('mont') ? ' (Montada)' : text.includes('costas') ? ' (Costas)' : '';
      return { type: 'score', target, field: 'pontos', delta: 4, desc: `+4 Pontos para ${label}${golpe}` };
    }

    // 3 Pontos: Passagem de Guarda
    if (/\b(tres pontos|três pontos|3 pontos|mais tres|mais três|mais 3|passagem de guarda|passagem|passou a guarda|passou|tres|três)\b/.test(text)) {
      const golpe = text.includes('pass') ? ' (Passagem de Guarda)' : '';
      return { type: 'score', target, field: 'pontos', delta: 3, desc: `+3 Pontos para ${label}${golpe}` };
    }

    // 2 Pontos: Queda, Raspagem, Joelho na barriga
    if (/\b(dois pontos|2 pontos|mais dois|mais 2|queda|derrubou|raspagem|raspou|joelho na barriga|joelho|dois)\b/.test(text)) {
      const golpe = text.includes('queda') || text.includes('derrub') ? ' (Queda)' :
                    text.includes('rasp') ? ' (Raspagem)' :
                    text.includes('joelho') ? ' (Joelho na Barriga)' : '';
      return { type: 'score', target, field: 'pontos', delta: 2, desc: `+2 Pontos para ${label}${golpe}` };
    }

    // Vantagem
    if (/\b(vantagem|uma vantagem|1 vantagem|mais vantagem|ponto de vantagem)\b/.test(text)) {
      return { type: 'score', target, field: 'vantagem', delta: 1, desc: `+1 Vantagem para ${label}` };
    }

    // Punição / Penalidade
    if (/\b(punicao|punição|uma punicao|uma punição|falta|uma falta|penalidade|penalizacao|penalização|shido)\b/.test(text)) {
      return { type: 'score', target, field: 'penalidade', delta: 1, desc: `+1 Punição para ${label}` };
    }

    return null;
  }, []);

  // Executa com segurança o comando recebido por voz
  const executeRefereeCommand = useCallback((cmd) => {
    if (!cmd) return;

    if (cmd.type === 'score') {
      addScore(cmd.target, cmd.field, cmd.delta);
      if (cmd.target === 'atletaA') {
        setHighlightA(true);
        setTimeout(() => setHighlightA(false), 1400);
      } else if (cmd.target === 'atletaB') {
        setHighlightB(true);
        setTimeout(() => setHighlightB(false), 1400);
      }
    } else if (cmd.type === 'control') {
      if (cmd.action === 'start' && !runningRef.current) {
        setRunning(true);
        ctrl('start');
      } else if (cmd.action === 'pause' && runningRef.current) {
        setRunning(false);
        ctrl('pause');
      }
    } else if (cmd.type === 'undo') {
      undoLastAction();
    } else if (cmd.type === 'swap') {
      swapAthletes();
    } else if (cmd.type === 'resetScore') {
      resetScores();
    } else if (cmd.type === 'resetAll') {
      resetAll();
    }

    playChime(true);
    try { navigator.vibrate?.([70, 40, 70]); } catch {}
    setLastExecutedCmd(cmd.desc);
    setLiveSpeechText('');
  }, [addScore, ctrl, undoLastAction, swapAthletes, resetScores, resetAll]);

  // ============================================================
  // MOTOR DE ESCUTA CONTÍNUA (SPEECH TO TEXT PARA ÁRBITRO)
  // Com filtro anti-duplicação estrito para evitar pontuações 2x
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
      if (!textToProcess) return;

      const cmd = parseRefereeVoiceCommand(textToProcess);
      if (cmd) {
        const now = Date.now();
        const timeSinceLast = now - lastCmdTimeRef.current;
        const normalized = textToProcess.toLowerCase().trim();
        const cmdKey = `${cmd.type}_${cmd.target || ''}_${cmd.field || ''}_${cmd.delta || cmd.action || ''}`;

        // Se for o MESMO comando nos últimos 2.8s OU qualquer comando em menos de 1.2s, ignora para não duplicar
        if (timeSinceLast < 1200 || (timeSinceLast < 2800 && lastExecutedKeyRef.current === cmdKey)) {
          return;
        }

        lastCmdTimeRef.current = now;
        lastExecutedKeyRef.current = cmdKey;
        lastExecutedTextRef.current = normalized;

        executeRefereeCommand(cmd);
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
  }, [parseRefereeVoiceCommand, executeRefereeCommand]);

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

  // Abre o app oficial do Spotify no smartphone
  const openSpotifyAppOnPhone = () => {
    try {
      const a = document.createElement('a');
      a.href = 'spotify:';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        window.open('https://open.spotify.com', '_blank');
      }, 700);
    } catch {
      window.open('https://open.spotify.com', '_blank');
    }
    flash('Abrindo aplicativo oficial do Spotify... 🎵');
  };

  // Abre uma playlist específica direto no aplicativo do Spotify no celular
  const openSpotifyPlaylistOnPhone = (urlToSend, playlistName) => {
    const targetUrl = urlToSend || spotifyUrl;
    if (!targetUrl.trim()) {
      flash('Cole o link da playlist do Spotify!');
      return;
    }

    const parsed = parseSpotifyUrl(targetUrl);
    const plName = playlistName || 'Playlist';

    if (parsed) {
      try {
        const a = document.createElement('a');
        a.href = `spotify:${parsed.type}:${parsed.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
          window.open(targetUrl, '_blank');
        }, 700);
      } catch {
        window.open(targetUrl, '_blank');
      }
    } else {
      window.open(targetUrl, '_blank');
    }

    flash(`Abrindo "${plName}" no Spotify do celular! 🎵`);
  };

  // Busca músicas de treino de jiu-jitsu no app do Spotify
  const searchSpotifyOnPhone = (query = 'jiu jitsu treino') => {
    try {
      const a = document.createElement('a');
      a.href = `spotify:search:${encodeURIComponent(query)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
      }, 700);
    } catch {
      window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
    }
    flash(`Buscando "${query}" no Spotify! 🎵`);
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
          {/* BOTÃO PRINCIPAL DE DESTAQUE: ABRIR O APP DO SPOTIFY NO CELULAR */}
          <div className="spotify-main-cta-card">
            <button
              className="btn-open-spotify-app"
              onClick={openSpotifyAppOnPhone}
              title="Abrir aplicativo oficial do Spotify instalado no celular"
            >
              <span className="spotify-cta-icon">🟢</span>
              <span className="spotify-cta-text">Abrir App do Spotify no Celular</span>
            </button>
            <p className="spotify-cta-tip">
              Abra o Spotify no seu celular e transmita via Bluetooth ou Spotify Connect (ícone de dispositivos) para a TV ou caixa de som da academia!
            </p>
          </div>

          <div className="spotify-card">
            <div className="spotify-card-head">
              <h3>🎵 Playlists Prontas para Treino BJJ</h3>
              <button className="spotify-card-close" onClick={() => setShowSpotify(false)}>✕</button>
            </div>
            <p className="spotify-sub">Toque em qualquer playlist abaixo para abrir direto no seu app do Spotify:</p>
            <div className="preset-grid">
              {PRESET_PLAYLISTS.map((p) => (
                <button
                  key={p.url}
                  className="preset-btn"
                  onClick={() => openSpotifyPlaylistOnPhone(p.url, p.name)}
                >
                  <span className="preset-icon">▶</span>
                  <span className="preset-name">{p.name}</span>
                </button>
              ))}
            </div>

            <button
              className="btn-spotify-search"
              onClick={() => searchSpotifyOnPhone('jiu jitsu bjj treino')}
            >
              🔍 Buscar Mais Músicas de Jiu-Jitsu no Spotify
            </button>
          </div>

          <div className="spotify-card">
            <p className="spotify-sub">Ou abra qualquer link de playlist no seu celular:</p>
            <div className="spotify-custom-form">
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="open.spotify.com/playlist/..."
                className="input-text"
              />
              <button
                onClick={() => openSpotifyPlaylistOnPhone()}
                className="btn-send-spotify"
              >
                Abrir ➔
              </button>
            </div>
          </div>
        </section>
      )}

      {/* BANNER DO MODO CORRIGIR */}
      {fixMode && (
        <div className="fix-mode-banner">
          <div className="fix-mode-left">
            <span className="fix-mode-icon">⚠️</span>
            <div className="fix-mode-info">
              <span className="fix-mode-title">MODO CORREÇÃO ATIVO</span>
              <span className="fix-mode-desc">Toques no placar e botões agora <strong>subtraem (−)</strong> pontos.</span>
            </div>
          </div>
          <button className="btn-exit-fix" onClick={() => setFixMode(false)}>✕ Sair</button>
        </div>
      )}

      {/* O PLACAR VISUAL DA TV (CLONE 1:1 INTERATIVO) */}
      <main className={`tv-clone-board ${fixMode ? 'tv-clone-board--fix' : ''}`}>
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
              onClick={() => handleCellClick('atletaA', 'pontos')}
              title={fixMode ? 'Subtrair 2 pontos' : 'Toque para +2 pontos'}
            >
              <span className="tv-clone-num">{match.atletaA.pontos}</span>
              {fixMode && <span className="cell-fix-badge">−2</span>}
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--adv"
              onClick={() => handleCellClick('atletaA', 'vantagem')}
              title={fixMode ? 'Subtrair 1 vantagem' : 'Toque para +1 vantagem'}
            >
              <span className="tv-clone-num">{match.atletaA.vantagem}</span>
              {fixMode && <span className="cell-fix-badge">−1</span>}
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--pen"
              onClick={() => handleCellClick('atletaA', 'penalidade')}
              title={fixMode ? 'Subtrair 1 punição' : 'Toque para +1 punição'}
            >
              <span className="tv-clone-num">{match.atletaA.penalidade}</span>
              {fixMode && <span className="cell-fix-badge">−1</span>}
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
              onClick={() => handleCellClick('atletaB', 'pontos')}
              title={fixMode ? 'Subtrair 2 pontos' : 'Toque para +2 pontos'}
            >
              <span className="tv-clone-num">{match.atletaB.pontos}</span>
              {fixMode && <span className="cell-fix-badge">−2</span>}
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--adv"
              onClick={() => handleCellClick('atletaB', 'vantagem')}
              title={fixMode ? 'Subtrair 1 vantagem' : 'Toque para +1 vantagem'}
            >
              <span className="tv-clone-num">{match.atletaB.vantagem}</span>
              {fixMode && <span className="cell-fix-badge">−1</span>}
            </div>

            <div
              className="tv-clone-cell tv-clone-cell--pen"
              onClick={() => handleCellClick('atletaB', 'penalidade')}
              title={fixMode ? 'Subtrair 1 punição' : 'Toque para +1 punição'}
            >
              <span className="tv-clone-num">{match.atletaB.penalidade}</span>
              {fixMode && <span className="cell-fix-badge">−1</span>}
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
            onClick={toggleStartPause}
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
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', fixMode ? -2 : 2)}>
            {fixMode ? '−2' : '+2'}
          </button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', fixMode ? -3 : 3)}>
            {fixMode ? '−3' : '+3'}
          </button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaA', 'pontos', fixMode ? -4 : 4)}>
            {fixMode ? '−4' : '+4'}
          </button>
          <button className="tb-btn tb-btn--v" onClick={() => addScore('atletaA', 'vantagem', fixMode ? -1 : 1)}>
            {fixMode ? '−V' : '+V'}
          </button>
          <button className="tb-btn tb-btn--x" onClick={() => addScore('atletaA', 'penalidade', fixMode ? -1 : 1)}>
            {fixMode ? '−P' : '+P'}
          </button>
          <button
            className="tb-btn tb-btn--sub"
            disabled={!fixMode && match.atletaA.pontos === 0}
            onClick={() => addScore('atletaA', 'pontos', fixMode ? 1 : -1)}
            title={fixMode ? 'Adicionar 1 ponto' : 'Subtrair 1 ponto'}
          >
            {fixMode ? '+1' : '−1'}
          </button>
        </div>

        {/* Atleta B Side Bar */}
        <div className="toolbar-side-row toolbar-side-row--b">
          <span className="toolbar-side-tag toolbar-side-tag--b">ATLETA B</span>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', fixMode ? -2 : 2)}>
            {fixMode ? '−2' : '+2'}
          </button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', fixMode ? -3 : 3)}>
            {fixMode ? '−3' : '+3'}
          </button>
          <button className="tb-btn tb-btn--p" onClick={() => addScore('atletaB', 'pontos', fixMode ? -4 : 4)}>
            {fixMode ? '−4' : '+4'}
          </button>
          <button className="tb-btn tb-btn--v" onClick={() => addScore('atletaB', 'vantagem', fixMode ? -1 : 1)}>
            {fixMode ? '−V' : '+V'}
          </button>
          <button className="tb-btn tb-btn--x" onClick={() => addScore('atletaB', 'penalidade', fixMode ? -1 : 1)}>
            {fixMode ? '−P' : '+P'}
          </button>
          <button
            className="tb-btn tb-btn--sub"
            disabled={!fixMode && match.atletaB.pontos === 0}
            onClick={() => addScore('atletaB', 'pontos', fixMode ? 1 : -1)}
            title={fixMode ? 'Adicionar 1 ponto' : 'Subtrair 1 ponto'}
          >
            {fixMode ? '+1' : '−1'}
          </button>
        </div>

        {/* Ações Gerais (Idênticas aos botões inferiores da TV) */}
        <div className="toolbar-actions-row">
          <button
            className={`tb-action-btn ${running ? 'tb-action-btn--warn' : 'tb-action-btn--go'}`}
            onClick={toggleStartPause}
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
          <button
            className={`tb-action-btn tb-action-btn--fix ${fixMode ? 'active' : ''}`}
            onClick={() => {
              setFixMode(!fixMode);
              try { navigator.vibrate?.(40); } catch {}
              flash(!fixMode ? 'Modo Corrigir: botões e toques agora SUBTRAEM (−)' : 'Modo normal (+) ativado');
            }}
            title="Alternar modo de correção"
          >
            {fixMode ? '✓ Corrigindo' : '✎ Corrigir'}
          </button>
          <button className="tb-action-btn" onClick={swapAthletes} title="Inverter lados">
            ⇄ Trocar Lados
          </button>
          <button
            className="tb-action-btn tb-action-btn--reset"
            onClick={resetScores}
            title="Zerar apenas os pontos dos dois atletas"
          >
            ↺ Zerar Pontos
          </button>
          <button
            className="tb-action-btn tb-action-btn--reset-all"
            onClick={resetAll}
            title="Zerar pontuações e reiniciar o tempo da luta"
          >
            ↺ Reiniciar Luta
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
