import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Atleta } from '../hooks/usePlacar';

const { width } = Dimensions.get('window');
const isLandscape = width > 800;

interface TVControlsProps {
  placar: {
    atletaA: Atleta;
    atletaB: Atleta;
    statusLuta: string;
  };
  timer: {
    formatted: string;
    minutes: number;
    seconds: number;
    isRunning: boolean;
  };
  focusedItem: string;
  onFocusChange: (item: string) => void;
  onUpdateAtleta: (athlete: 'atletaA' | 'atletaB', field: string, value: any) => void;
  onUpdateStatus: (status: 'INÍCIO' | 'DURANTE' | 'FINAL') => void;
  onAddPonto: (athlete: 'atletaA' | 'atletaB', value: number) => void;
  onAddVantagem: (athlete: 'atletaA' | 'atletaB', value: number) => void;
  onAddPenalidade: (athlete: 'atletaA' | 'atletaB', value: number) => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onReset: () => void;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  section: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: isLandscape ? 18 : 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
  },
  scoreGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  btn: {
    width: isLandscape ? 60 : 50,
    height: isLandscape ? 60 : 50,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  btnFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f4ff',
  },
  btnText: {
    fontSize: isLandscape ? 28 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scoreValue: {
    fontSize: isLandscape ? 32 : 28,
    fontWeight: '800',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
});

export const TVControls = ({
  placar,
  focusedItem,
  onAddPonto,
  onAddVantagem,
  onAddPenalidade,
}: TVControlsProps) => {
  const renderScoreGroup = (
    label: string,
    value: number,
    focusId: string,
    onMinus: () => void,
    onPlus: () => void
  ) => (
    <View style={styles.scoreGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.btn, focusedItem === focusId && styles.btnFocused]}
          onPress={onMinus}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.scoreValue}>{value}</Text>
        <TouchableOpacity
          style={[styles.btn, focusedItem === focusId && styles.btnFocused]}
          onPress={onPlus}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ATLETA A */}
      <View style={styles.section}>
        <Text style={styles.title}>ATLETA A</Text>
        {renderScoreGroup(
          'Pontos',
          placar.atletaA.pontos,
          'atletaA-p',
          () => onAddPonto('atletaA', -1),
          () => onAddPonto('atletaA', 1)
        )}
        {renderScoreGroup(
          'Vantagem',
          placar.atletaA.vantagem,
          'atletaA-v',
          () => onAddVantagem('atletaA', -1),
          () => onAddVantagem('atletaA', 1)
        )}
        {renderScoreGroup(
          'Penalidade',
          placar.atletaA.penalidade,
          'atletaA-pen',
          () => onAddPenalidade('atletaA', -1),
          () => onAddPenalidade('atletaA', 1)
        )}
      </View>

      {/* ATLETA B */}
      <View style={styles.section}>
        <Text style={styles.title}>ATLETA B</Text>
        {renderScoreGroup(
          'Pontos',
          placar.atletaB.pontos,
          'atletaB-p',
          () => onAddPonto('atletaB', -1),
          () => onAddPonto('atletaB', 1)
        )}
        {renderScoreGroup(
          'Vantagem',
          placar.atletaB.vantagem,
          'atletaB-v',
          () => onAddVantagem('atletaB', -1),
          () => onAddVantagem('atletaB', 1)
        )}
        {renderScoreGroup(
          'Penalidade',
          placar.atletaB.penalidade,
          'atletaB-pen',
          () => onAddPenalidade('atletaB', -1),
          () => onAddPenalidade('atletaB', 1)
        )}
      </View>
    </View>
  );
};
