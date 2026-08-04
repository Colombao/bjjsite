import { useState } from 'react';

export type Atleta = {
  nome: string;
  team: string;
  pontos: number;
  vantagem: number;
  penalidade: number;
};

export type StatusLuta = 'INÍCIO' | 'DURANTE' | 'FINAL';

export type PlacarState = {
  atletaA: Atleta;
  atletaB: Atleta;
  statusLuta: StatusLuta;
};

const initialAtleta = (nome: string, team: string): Atleta => ({
  nome,
  team,
  pontos: 0,
  vantagem: 0,
  penalidade: 0,
});

export function usePlacar() {
  const [placar, setPlacar] = useState<PlacarState>({
    atletaA: initialAtleta('ATLETA A', 'EQUIPE A'),
    atletaB: initialAtleta('ATLETA B', 'EQUIPE B'),
    statusLuta: 'INÍCIO',
  });

  const updateAtleta = (
    athlete: 'atletaA' | 'atletaB',
    field: keyof Atleta,
    value: string | number
  ) => {
    setPlacar((prev) => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: typeof value === 'number' ? Math.max(0, value) : value,
      },
    }));
  };

  const bump = (
    athlete: 'atletaA' | 'atletaB',
    field: 'pontos' | 'vantagem' | 'penalidade',
    delta: number
  ) => {
    setPlacar((prev) => ({
      ...prev,
      [athlete]: {
        ...prev[athlete],
        [field]: Math.max(0, prev[athlete][field] + delta),
      },
      statusLuta: prev.statusLuta === 'INÍCIO' ? 'DURANTE' : prev.statusLuta,
    }));
  };

  const updateStatus = (status: StatusLuta) => {
    setPlacar((prev) => ({ ...prev, statusLuta: status }));
  };

  const reset = () => {
    setPlacar({
      atletaA: initialAtleta(placar.atletaA.nome, placar.atletaA.team),
      atletaB: initialAtleta(placar.atletaB.nome, placar.atletaB.team),
      statusLuta: 'INÍCIO',
    });
  };

  return { placar, updateAtleta, bump, updateStatus, reset };
}
