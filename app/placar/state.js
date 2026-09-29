/* Estado compartilhado do placar (TV = autoridade). */

export const DEFAULT_STATE = {
  atletaA: {
    nome: 'ATLETA A',
    team: 'BJJ TEAM A',
    pontos: 0,
    vantagem: 0,
    penalidade: 0,
  },
  atletaB: {
    nome: 'ATLETA B',
    team: 'BJJ TEAM B',
    pontos: 0,
    vantagem: 0,
    penalidade: 0,
  },
  tempo: '05:00',
  statusLuta: 'FINAL',
};

export const fmtTempo = (mins) =>
  `${String(mins).padStart(2, '0')}:00`;

export const applyCtrl = (match, running, msg) => {
  const { action } = msg || {};
  if (!action) return { match, running };

  if (action === 'score') {
    const { athlete, field, delta = 0 } = msg;
    if (!match[athlete] || !['pontos', 'vantagem', 'penalidade'].includes(field)) {
      return { match, running };
    }
    return {
      running,
      match: {
        ...match,
        [athlete]: {
          ...match[athlete],
          [field]: Math.max(0, (match[athlete][field] || 0) + Number(delta)),
        },
      },
    };
  }

  if (action === 'set') {
    const { athlete, field, value } = msg;
    if (!match[athlete] || !['nome', 'team'].includes(field)) {
      return { match, running };
    }
    const text = String(value ?? '').slice(0, 30);
    return {
      running,
      match: {
        ...match,
        [athlete]: { ...match[athlete], [field]: text },
      },
    };
  }

  if (action === 'edit') {
    return {
      running,
      match: {
        ...match,
        atletaA: msg.atletaA ? { ...match.atletaA, ...msg.atletaA } : match.atletaA,
        atletaB: msg.atletaB ? { ...match.atletaB, ...msg.atletaB } : match.atletaB,
        tempo: msg.tempo || match.tempo,
      },
    };
  }

  if (action === 'status') {
    const value = msg.value;
    if (!['INÍCIO', 'DURANTE', 'FINAL'].includes(value)) return { match, running };
    return { running, match: { ...match, statusLuta: value } };
  }

  if (action === 'timerSet') {
    const minutes = Math.max(1, Math.min(99, Number(msg.minutes) || 5));
    return { running: false, match: { ...match, tempo: fmtTempo(minutes) } };
  }

  if (action === 'startPause') {
    return { match, running: !running };
  }

  if (action === 'start') {
    return { match, running: true };
  }

  if (action === 'pause') {
    return { match, running: false };
  }

  if (action === 'resetScore' || action === 'resetScores') {
    return {
      running,
      match: {
        ...match,
        atletaA: { ...match.atletaA, pontos: 0, vantagem: 0, penalidade: 0 },
        atletaB: { ...match.atletaB, pontos: 0, vantagem: 0, penalidade: 0 },
      },
    };
  }

  if (action === 'reset') {
    return {
      running: false,
      match: {
        ...match,
        atletaA: { ...match.atletaA, pontos: 0, vantagem: 0, penalidade: 0 },
        atletaB: { ...match.atletaB, pontos: 0, vantagem: 0, penalidade: 0 },
        tempo: msg.tempo || match.tempo || '05:00',
        statusLuta: 'INÍCIO',
      },
    };
  }

  if (action === 'swap') {
    return {
      running,
      match: {
        ...match,
        atletaA: { ...match.atletaB },
        atletaB: { ...match.atletaA },
      },
    };
  }

  return { match, running };
};

export const tickTempo = (tempo) => {
  const [mins, secs] = String(tempo || '00:00').split(':').map(Number);
  let newSecs = (secs || 0) - 1;
  let newMins = mins || 0;
  if (newSecs < 0) {
    newSecs = 59;
    newMins -= 1;
  }
  if (newMins < 0) return { tempo, done: true };
  return {
    tempo: `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`,
    done: false,
  };
};
