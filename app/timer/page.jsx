'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sound, fmt, playAudio, DEFAULT_MODES, PHASE_TXT } from './core';
import { dbLoad, dbSave } from './db';
import SpotifyDial from './SpotifyDial';
import RemoteBridge from './RemoteBridge';
import './timer.css';

export default function TimerPage() {
  // Configurações
  const [numRounds, setNumRounds] = useState(5);
  const [workMin, setWorkMin] = useState(5);
  const [workSec, setWorkSec] = useState(0);
  const [restMin, setRestMin] = useState(1);
  const [restSec, setRestSec] = useState(0);
  const [prepSec, setPrepSec] = useState(10);
  const [soundStart, setSoundStart] = useState('bell');
  const [soundEnd, setSoundEnd] = useState('buzzer');
  const [warnBeeps, setWarnBeeps] = useState(true);
  const [customSounds, setCustomSounds] = useState({ start: null, end: null });

  // Estado ativo
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState('prepare');
  const [timeLeft, setTimeLeft] = useState(10);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [wallClock, setWallClock] = useState('');

  // Modos
  const [customModes, setCustomModes] = useState([]);
  const [activeMode, setActiveMode] = useState(null);
  const [newModeName, setNewModeName] = useState('');

  // Textos da tela (título e frase de cada fase) — personalizáveis
  const [texts, setTexts] = useState(PHASE_TXT);

  const totalRef = useRef(10);

  const loaded = useRef(false);

  // Carrega config: localStorage (rápido) + banco mockado (persiste entre navegadores)
  useEffect(() => {
    const applyCfg = (saved) => {
      if (!saved) return;
      setNumRounds(saved.numRounds ?? 5);
      setWorkMin(saved.workMin ?? 5);
      setWorkSec(saved.workSec ?? 0);
      setRestMin(saved.restMin ?? 1);
      setRestSec(saved.restSec ?? 0);
      setPrepSec(saved.prepSec ?? 10);
      setSoundStart(saved.soundStart ?? 'bell');
      setSoundEnd(saved.soundEnd ?? 'buzzer');
      setWarnBeeps(saved.warnBeeps ?? true);
    };
    // Garante que textos salvos incompletos sempre tenham os padrões como base
    const mergeTexts = (t) =>
      Object.fromEntries(
        Object.keys(PHASE_TXT).map((k) => [k, { ...PHASE_TXT[k], ...(t?.[k] || {}) }])
      );
    try {
      applyCfg(JSON.parse(localStorage.getItem('heishikan_timer_cfg') || 'null'));
      const modes = JSON.parse(localStorage.getItem('heishikan_timer_modes') || 'null');
      if (Array.isArray(modes)) setCustomModes(modes);
      const savedTexts = JSON.parse(localStorage.getItem('heishikan_timer_texts') || 'null');
      if (savedTexts) setTexts(mergeTexts(savedTexts));
    } catch {}
    dbLoad().then((d) => {
      if (d) {
        if (d.cfg) applyCfg(d.cfg);
        if (Array.isArray(d.modes)) setCustomModes(d.modes);
        if (d.sounds) setCustomSounds({ start: d.sounds.start ?? null, end: d.sounds.end ?? null });
        if (d.texts) setTexts(mergeTexts(d.texts));
      }
      loaded.current = true;
    });
  }, []);

  const updateText = (key, field, value) => {
    setTexts((prev) => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } };
      try { localStorage.setItem('heishikan_timer_texts', JSON.stringify(next)); } catch {}
      if (loaded.current) dbSave({ texts: next }, 'texts');
      return next;
    });
  };

  const resetTexts = () => {
    setTexts(PHASE_TXT);
    try { localStorage.removeItem('heishikan_timer_texts'); } catch {}
    if (loaded.current) dbSave({ texts: PHASE_TXT }, 'texts');
  };

  useEffect(() => {
    const cfg = { numRounds, workMin, workSec, restMin, restSec, prepSec, soundStart, soundEnd, warnBeeps };
    try { localStorage.setItem('heishikan_timer_cfg', JSON.stringify(cfg)); } catch {}
    if (loaded.current) dbSave({ cfg }, 'cfg');
  }, [numRounds, workMin, workSec, restMin, restSec, prepSec, soundStart, soundEnd, warnBeeps]);

  // Sincroniza saída do fullscreen (ESC)
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setTvMode(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Atualiza timeLeft quando config muda parado
  useEffect(() => {
    if (!running && phase === 'prepare' && round === 1) {
      setTimeLeft(prepSec);
      totalRef.current = prepSec;
    }
  }, [prepSec, numRounds, workMin, workSec, restMin, restSec, running, phase, round]);

  const play = useCallback(
    (type) => {
      if (muted) return;
      const pick = (sel, custom) => {
        if (sel === 'custom' && custom) playAudio(custom);
        else if (sel === 'bell') Sound.bell();
        else Sound.buzzer();
      };
      if (type === 'start') pick(soundStart, customSounds.start);
      else if (type === 'end') pick(soundEnd, customSounds.end);
      else Sound.beep();
    },
    [muted, soundStart, soundEnd, customSounds]
  );

  // Upload de som personalizado (mp3/wav até 1 MB)
  const uploadSound = (slot) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 700_000) {
      alert('Arquivo muito grande — use um áudio de até 700 KB (sons de sino/sirene têm poucos segundos).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const next = { ...customSounds, [slot]: reader.result };
      setCustomSounds(next);
      if (slot === 'start') setSoundStart('custom');
      else setSoundEnd('custom');
      dbSave({ sounds: next }, 'sounds');
    };
    reader.readAsDataURL(file);
  };

  const removeSound = (slot) => {
    const next = { ...customSounds, [slot]: null };
    setCustomSounds(next);
    if (slot === 'start' && soundStart === 'custom') setSoundStart('bell');
    if (slot === 'end' && soundEnd === 'custom') setSoundEnd('buzzer');
    dbSave({ sounds: next }, 'sounds');
  };

  // Horário atual (relógio de parede) — útil no tatame / modo TV
  useEffect(() => {
    const tick = () => {
      setWallClock(
        new Date().toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimeLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Transições de fase
  useEffect(() => {
    if (!running || timeLeft !== 0) return;
    const workTotal = workMin * 60 + workSec;
    const restTotal = restMin * 60 + restSec;

    if (phase === 'prepare') {
      setPhase('work'); setTimeLeft(workTotal); totalRef.current = workTotal; play('start');
    } else if (phase === 'work') {
      play('end');
      if (round < numRounds) {
        setPhase('rest'); setTimeLeft(restTotal); totalRef.current = restTotal;
      } else {
        setPhase('finished'); setRunning(false);
      }
    } else if (phase === 'rest') {
      setRound((p) => p + 1);
      setPhase('work'); setTimeLeft(workTotal); totalRef.current = workTotal; play('start');
    }
  }, [timeLeft, running, phase, workMin, workSec, restMin, restSec, round, numRounds, play]);

  // Beeps finais — últimos 5 segundos do combate
  useEffect(() => {
    if (running && phase === 'work' && warnBeeps && timeLeft > 0 && timeLeft <= 5) play('warning');
  }, [timeLeft, running, phase, warnBeeps, play]);

  const startPause = () => { Sound.init(); setRunning((r) => !r); };

  const reset = () => {
    setRunning(false); setRound(1); setPhase('prepare');
    setTimeLeft(prepSec); totalRef.current = prepSec;
  };

  /* ---------- Modos de treino ---------- */
  const applyMode = (m) => {
    setNumRounds(m.numRounds);
    setWorkMin(m.workMin); setWorkSec(m.workSec);
    setRestMin(m.restMin); setRestSec(m.restSec);
    setPrepSec(m.prepSec);
    setActiveMode(m.name);
    setRunning(false); setRound(1); setPhase('prepare');
    setTimeLeft(m.prepSec); totalRef.current = m.prepSec;
  };

  const saveMode = () => {
    const name = newModeName.trim();
    if (!name) return;
    const mode = { name, numRounds, workMin, workSec, restMin, restSec, prepSec };
    const next = [...customModes.filter((m) => m.name !== name), mode];
    setCustomModes(next);
    setActiveMode(name);
    setNewModeName('');
    try { localStorage.setItem('heishikan_timer_modes', JSON.stringify(next)); } catch {}
    dbSave({ modes: next }, 'modes');
  };

  const deleteMode = (name) => {
    const next = customModes.filter((m) => m.name !== name);
    setCustomModes(next);
    if (activeMode === name) setActiveMode(null);
    try { localStorage.setItem('heishikan_timer_modes', JSON.stringify(next)); } catch {}
    dbSave({ modes: next }, 'modes');
  };

  // Desmarca o modo ativo se a config for alterada manualmente
  useEffect(() => {
    if (!activeMode) return;
    const m = [...DEFAULT_MODES, ...customModes].find((x) => x.name === activeMode);
    if (!m) return;
    if (
      m.numRounds !== numRounds || m.workMin !== workMin || m.workSec !== workSec ||
      m.restMin !== restMin || m.restSec !== restSec || m.prepSec !== prepSec
    ) setActiveMode(null);
  }, [activeMode, customModes, numRounds, workMin, workSec, restMin, restSec, prepSec]);

  const enterTv = async () => {
    setTvMode(true);
    try { await document.documentElement.requestFullscreen?.(); } catch {}
  };
  const exitTv = async () => {
    setTvMode(false);
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
  };

  // Comandos vindos do celular (RemoteBridge)
  useEffect(() => {
    const onCtrl = (e) => {
      const { action, name } = e.detail || {};
      if (action === 'startPause') startPause();
      else if (action === 'reset') reset();
      else if (action === 'mute') setMuted((m) => !m);
      else if (action === 'mode') {
        const m = [...DEFAULT_MODES, ...customModes].find((x) => x.name === name);
        if (m) applyMode(m);
      }
    };
    window.addEventListener('rt-remote-ctrl', onCtrl);
    return () => window.removeEventListener('rt-remote-ctrl', onCtrl);
  });

  // Atalhos de teclado (funcionam com o controle da smart TV):
  // OK/Enter/Espaço = iniciar/pausar · ← = zerar · → = mudo
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'MediaPlayPause') {
        e.preventDefault(); startPause();
      } else if (e.key === 'ArrowLeft') reset();
      else if (e.key === 'ArrowRight') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pct = ((totalRef.current - timeLeft) / (totalRef.current || 1)) * 100;
  const txt = texts[phase] || texts.prepare;
  const phaseMod = phase === 'work' ? 'work' : phase === 'rest' ? 'rest' : 'prepare';

  const modeBtn = (m) => (
    <button
      key={m.name}
      className={`rt-mode-btn ${activeMode === m.name ? 'rt-mode-btn--active' : ''}`}
      onClick={() => applyMode(m)}
    >
      <strong>{m.name}</strong>
      <span>{m.numRounds}x {fmt(m.workMin * 60 + m.workSec)} · desc. {fmt(m.restMin * 60 + m.restSec)}</span>
    </button>
  );

  return (
    <main className="rt-page">
      {/* Cabeçalho */}
      <header className="rt-header">
        <div className="rt-brand">
          <img src="/img/logo-heishikan.png" alt="CT Heishikan" />
          <div>
            <div className="rt-brand-top">CT HEISHIKAN</div>
            <div className="rt-brand-sub">Cronômetro de Rounds</div>
          </div>
        </div>
        <div className="rt-actions">
          <button className="rt-btn" onClick={() => setMuted((m) => !m)}>
            {muted ? '🔇 Mudo' : '🔊 Som ativo'}
          </button>
          <RemoteBridge modeNames={[...DEFAULT_MODES, ...customModes].map((m) => m.name)} />
          <button className="rt-btn rt-btn--gold" onClick={enterTv}>
            Modo TV (tela cheia)
          </button>
        </div>
      </header>

      <div className="rt-grid">
        {/* Painel principal */}
        <section className={`rt-main rt-main--${phaseMod}`}>
          <div className="rt-main-top">
            <span className="rt-brand-sub">Roger Santos Jiu-Jitsu</span>
            <div className="rt-main-top-right">
              {activeMode && <span className="rt-mode-tag" title="Modo de treino ativo">{activeMode}</span>}
              <time className="rt-wallclock" dateTime={wallClock} aria-label="Horário atual">
                {wallClock}
              </time>
              <span className="rt-round-badge">
                {phase === 'finished' ? 'Concluído' : `Round ${round} de ${numRounds}`}
              </span>
            </div>
          </div>

          <div className="rt-core">
            <span className={`rt-phase-label rt-phase-label--${phaseMod}`}>{txt.title}</span>
            <h1 className={`rt-clock rt-clock--${phaseMod}`}>{fmt(timeLeft)}</h1>
            <p className="rt-hint">{txt.hint}</p>
          </div>

          <div className="rt-progress">
            <div className={`rt-progress-fill rt-progress-fill--${phaseMod}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="rt-main-controls">
            <button className="rt-btn rt-btn--gold rt-btn--big" onClick={startPause} disabled={phase === 'finished'}>
              {running ? '❚❚ Pausar' : '▶ Iniciar'}
            </button>
            <button className="rt-btn rt-btn--big" onClick={reset}>↺ Zerar</button>
            <button className="rt-btn" onClick={() => !muted && Sound.bell()} title="Tocar sino">🔔</button>
            <button className="rt-btn" onClick={() => !muted && Sound.buzzer()} title="Tocar sirene">📢</button>
          </div>
        </section>

        {/* Ajustes */}
        <aside className="rt-side">
          <div className="rt-card">
            <h3>Modos de Treino</h3>

            <div className="rt-modes">
              {DEFAULT_MODES.map(modeBtn)}
              {customModes.map((m) => (
                <div key={m.name} className="rt-mode-row">
                  {modeBtn(m)}
                  <button className="rt-mode-del" onClick={() => deleteMode(m.name)} title={`Excluir modo ${m.name}`}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="rt-mode-save">
              <input
                type="text"
                maxLength={24}
                placeholder="Nome do novo modo…"
                value={newModeName}
                onChange={(e) => setNewModeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveMode()}
              />
              <button className="rt-btn" onClick={saveMode} disabled={!newModeName.trim()}>
                Salvar
              </button>
            </div>
            <p className="rt-mode-hint">Ajuste os tempos abaixo e salve como um modo seu.</p>
          </div>

          <div className="rt-card">
            <h3>Estrutura de Combates</h3>

            <div className="rt-field">
              <label>Número de rounds</label>
              <div className="rt-stepper">
                <button onClick={() => setNumRounds((p) => Math.max(1, p - 1))}>−</button>
                <input
                  type="number" min="1" max="99" value={numRounds}
                  onChange={(e) => setNumRounds(Math.max(1, Number(e.target.value)))}
                />
                <button onClick={() => setNumRounds((p) => Math.min(99, p + 1))}>+</button>
              </div>
            </div>

            <div className="rt-field">
              <label>Duração do rola (combate)</label>
              <div className="rt-row2">
                <input type="number" min="0" max="59" value={workMin} aria-label="Minutos"
                  onChange={(e) => setWorkMin(Math.max(0, Number(e.target.value)))} />
                <input type="number" min="0" max="59" value={workSec} aria-label="Segundos"
                  onChange={(e) => setWorkSec(Math.max(0, Number(e.target.value)))} />
              </div>
            </div>

            <div className="rt-field">
              <label>Tempo de descanso</label>
              <div className="rt-row2">
                <input type="number" min="0" max="59" value={restMin} aria-label="Minutos"
                  onChange={(e) => setRestMin(Math.max(0, Number(e.target.value)))} />
                <input type="number" min="0" max="59" value={restSec} aria-label="Segundos"
                  onChange={(e) => setRestSec(Math.max(0, Number(e.target.value)))} />
              </div>
            </div>

            <div className="rt-field">
              <label>Preparação inicial (segundos)</label>
              <input type="number" min="0" max="120" value={prepSec}
                onChange={(e) => setPrepSec(Math.max(0, Number(e.target.value)))} />
            </div>
          </div>

          <div className="rt-card">
            <h3>Textos da Tela</h3>

            {[
              ['prepare', 'Preparação'],
              ['work', 'Combate'],
              ['rest', 'Descanso'],
              ['finished', 'Treino concluído'],
            ].map(([key, label]) => (
              <div className="rt-field" key={key}>
                <label>{label}</label>
                <div className="rt-text-pair">
                  <input
                    type="text" className="rt-text-input" maxLength={40}
                    placeholder={`Título (ex: ${PHASE_TXT[key].title})`}
                    value={texts[key].title}
                    onChange={(e) => updateText(key, 'title', e.target.value)}
                  />
                  <input
                    type="text" className="rt-text-input" maxLength={90}
                    placeholder={`Frase (ex: ${PHASE_TXT[key].hint})`}
                    value={texts[key].hint}
                    onChange={(e) => updateText(key, 'hint', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button className="rt-btn" onClick={resetTexts}>↺ Restaurar textos padrão</button>
          </div>

          <div className="rt-card">
            <h3>Alertas Sonoros</h3>

            <div className="rt-field">
              <label>Som de início</label>
              <select value={soundStart} onChange={(e) => setSoundStart(e.target.value)}>
                <option value="bell">Sino (gongo)</option>
                <option value="buzzer">Sirene eletrônica</option>
                <option value="custom" disabled={!customSounds.start}>Personalizado</option>
              </select>
              <div className="rt-upload-row">
                <label className="rt-upload-btn">
                  ⬆ {customSounds.start ? 'Trocar áudio' : 'Enviar áudio'}
                  <input type="file" accept="audio/*" onChange={uploadSound('start')} />
                </label>
                {customSounds.start && (
                  <>
                    <button className="rt-upload-mini" onClick={() => playAudio(customSounds.start)} title="Testar">▶</button>
                    <button className="rt-upload-mini rt-upload-mini--del" onClick={() => removeSound('start')} title="Remover">✕</button>
                  </>
                )}
              </div>
            </div>

            <div className="rt-field">
              <label>Som de fim</label>
              <select value={soundEnd} onChange={(e) => setSoundEnd(e.target.value)}>
                <option value="buzzer">Sirene eletrônica</option>
                <option value="bell">Sino (gongo)</option>
                <option value="custom" disabled={!customSounds.end}>Personalizado</option>
              </select>
              <div className="rt-upload-row">
                <label className="rt-upload-btn">
                  ⬆ {customSounds.end ? 'Trocar áudio' : 'Enviar áudio'}
                  <input type="file" accept="audio/*" onChange={uploadSound('end')} />
                </label>
                {customSounds.end && (
                  <>
                    <button className="rt-upload-mini" onClick={() => playAudio(customSounds.end)} title="Testar">▶</button>
                    <button className="rt-upload-mini rt-upload-mini--del" onClick={() => removeSound('end')} title="Remover">✕</button>
                  </>
                )}
              </div>
            </div>

            <div className="rt-check">
              <span>Beeps de alerta final (últimos 5s)</span>
              <input type="checkbox" checked={warnBeeps}
                onChange={(e) => setWarnBeeps(e.target.checked)} />
            </div>
          </div>
        </aside>
      </div>

      {/* Modo TV */}
      {tvMode && (
        <div className="rt-tv">
          <div className="rt-tv-head">
            <div className="rt-brand">
              <img src="/img/logo-heishikan.png" alt="CT Heishikan" />
              <div>
                <div className="rt-brand-top">CT HEISHIKAN</div>
                <div className="rt-brand-sub">Modo TV — Tatame</div>
              </div>
            </div>
            <div className="rt-actions">
              <time className="rt-wallclock rt-wallclock--tv" dateTime={wallClock} aria-label="Horário atual">
                {wallClock}
              </time>
              <button className="rt-btn" onClick={() => setMuted((m) => !m)}>
                {muted ? '🔇' : '🔊'}
              </button>
              <button className="rt-btn" onClick={exitTv}>✕ Sair</button>
            </div>
          </div>

          <div className="rt-tv-core">
            {activeMode && <span className="rt-tv-modename">{activeMode}</span>}
            <span className={`rt-phase-label rt-phase-label--${phaseMod}`} style={{ fontSize: 'clamp(.9rem,2.5vw,1.6rem)' }}>
              {txt.title}
            </span>
            <h1 className={`rt-tv-clock rt-clock--${phaseMod}`}>{fmt(timeLeft)}</h1>
            <p className="rt-hint" style={{ fontSize: 'clamp(1rem,2vw,1.4rem)' }}>{txt.hint}</p>
          </div>

          <div className="rt-tv-foot">
            <div className="rt-tv-foot-row">
              <span className="rt-tv-round">
                {phase === 'finished'
                  ? 'Sessão finalizada'
                  : <>Round <b>{round}</b> de <b>{numRounds}</b></>}
              </span>
              <div className="rt-actions">
                <button className="rt-btn rt-btn--gold rt-btn--big" onClick={startPause} disabled={phase === 'finished'}>
                  {running ? '❚❚ Pausar' : '▶ Iniciar'}
                </button>
                <button className="rt-btn rt-btn--big" onClick={reset}>↺ Zerar</button>
              </div>
            </div>
            <div className="rt-progress">
              <div className={`rt-progress-fill rt-progress-fill--${phaseMod}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}

      <SpotifyDial />
    </main>
  );
}
