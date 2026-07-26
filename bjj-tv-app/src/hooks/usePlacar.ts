import { useState } from 'react';

export interface Atleta {
  nome: string;
  team: string;
  pontos: number;
  vantagem: number;
  penalidade: number;
}

interface PlacarState {
  atletaA: Atleta;
  atletaB: Atleta;
  statusLuta: 'INÍCIO' | 'DURANTE' | 'FINAL';
}

export const usePlacar = () => {
  const [placar, setPlacar] = useState<PlacarState>({
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
    statusLuta: 'FINAL',
  });

  const updateAtleta = (
    athlete: 'atletaA' | 'atletaB',
    field: keyof Atleta,
    value: string | number
  ) => {
    setPlacar((prev) => {
      if (typeof value === 'number') {
        return {
          ...prev,
          [athlete]: {
            ...prev[athlete],
            [field]: Math.max(0, value),
          },
        };
      }
      return {
        ...prev,
        [athlete]: {
          ...prev[athlete],
          [field]: value,
        },
      };
    });
  };

  const updateStatus = (status: 'INÍCIO' | 'DURANTE' | 'FINAL') => {
    setPlacar((prev) => ({ ...prev, statusLuta: status }));
  };

  const reset = () => {
    setPlacar({
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
      statusLuta: 'FINAL',
    });
  };

  const addPonto = (athlete: 'atletaA' | 'atletaB', value: number) => {
    updateAtleta(athlete, 'pontos', placar[athlete].pontos + value);
  };

  const addVantagem = (athlete: 'atletaA' | 'atletaB', value: number) => {
    updateAtleta(athlete, 'vantagem', placar[athlete].vantagem + value);
  };

  const addPenalidade = (athlete: 'atletaA' | 'atletaB', value: number) => {
    updateAtleta(athlete, 'penalidade', placar[athlete].penalidade + value);
  };

  return {
    placar,
    updateAtleta,
    updateStatus,
    reset,
    addPonto,
    addVantagem,
    addPenalidade,
  };
};
