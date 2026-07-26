import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tvStyles } from '../styles/tvStyles';
import { Atleta } from '../hooks/usePlacar';
import { Timer } from './Timer';

interface PlacarProps {
  atletaA: Atleta;
  atletaB: Atleta;
  tempo: string;
  statusLuta: string;
  timerState: {
    formatted: string;
    isRunning: boolean;
  };
}

const styles = StyleSheet.create({
  displayContainer: {
    ...tvStyles.displayContainer,
  },
  row: {
    ...tvStyles.displayRow,
  },
  atletaDisplay: {
    ...tvStyles.atletaDisplay,
  },
  atletaNome: {
    ...tvStyles.atletaNome,
  },
  atletaTeam: {
    ...tvStyles.atletaTeam,
  },
  pontosGrid: {
    ...tvStyles.pontosGrid,
  },
  pontoBox: {
    ...tvStyles.pontoBox,
  },
  pontoBoxP2: {
    ...tvStyles.pontoBoxP2,
  },
  pontoBoxVantagem: {
    ...tvStyles.pontoBoxVantagem,
  },
  pontoBoxPenalidade: {
    ...tvStyles.pontoBoxPenalidade,
  },
  pontoValor: {
    ...tvStyles.pontoValor,
  },
  statusBar: {
    ...tvStyles.statusBar,
  },
  tempoDisplay: {
    ...tvStyles.tempoDisplay,
  },
  statusDisplay: {
    ...tvStyles.statusDisplay,
  },
  statusText: {
    ...tvStyles.statusText,
  },
});

export const Placar = ({
  atletaA,
  atletaB,
  tempo,
  statusLuta,
  timerState,
}: PlacarProps) => {
  return (
    <View style={styles.displayContainer}>
      {/* ATLETAS */}
      <View style={styles.row}>
        {/* ATLETA A */}
        <View style={styles.atletaDisplay}>
          <Text style={styles.atletaNome}>{atletaA.nome}</Text>
          <Text style={styles.atletaTeam}>{atletaA.team}</Text>

          <View style={styles.pontosGrid}>
            <View style={[styles.pontoBox, styles.pontoBoxP2]}>
              <Text style={styles.pontoValor}>{atletaA.pontos}</Text>
            </View>
            <View style={[styles.pontoBox, styles.pontoBoxVantagem]}>
              <Text style={styles.pontoValor}>{atletaA.vantagem}</Text>
            </View>
            <View style={[styles.pontoBox, styles.pontoBoxPenalidade]}>
              <Text style={styles.pontoValor}>{atletaA.penalidade}</Text>
            </View>
          </View>
        </View>

        {/* ATLETA B */}
        <View style={styles.atletaDisplay}>
          <Text style={styles.atletaNome}>{atletaB.nome}</Text>
          <Text style={styles.atletaTeam}>{atletaB.team}</Text>

          <View style={styles.pontosGrid}>
            <View style={[styles.pontoBox, styles.pontoBoxP2]}>
              <Text style={styles.pontoValor}>{atletaB.pontos}</Text>
            </View>
            <View style={[styles.pontoBox, styles.pontoBoxVantagem]}>
              <Text style={styles.pontoValor}>{atletaB.vantagem}</Text>
            </View>
            <View style={[styles.pontoBox, styles.pontoBoxPenalidade]}>
              <Text style={styles.pontoValor}>{atletaB.penalidade}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* STATUS BAR */}
      <View style={styles.statusBar}>
        <View style={styles.tempoDisplay}>
          <Timer formatted={timerState.formatted} isRunning={timerState.isRunning} />
        </View>
        <View style={styles.statusDisplay}>
          <Text style={styles.statusText}>{statusLuta}</Text>
        </View>
      </View>
    </View>
  );
};
