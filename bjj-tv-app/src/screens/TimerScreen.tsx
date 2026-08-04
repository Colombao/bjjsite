import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, useDeviceLayout } from '../theme';
import { BigButton } from '../components/BigButton';
import { KeepAwakeOn } from '../components/KeepAwakeOn';
import {
  DEFAULT_MODES,
  Phase,
  useRoundTimer,
} from '../hooks/useRoundTimer';

const PHASE_LABEL: Record<Phase, string> = {
  prepare: 'Preparação',
  work: 'Combate',
  rest: 'Descanso',
  finished: 'Concluído',
};

type Props = {
  onBack: () => void;
};

export function TimerScreen({ onBack }: Props) {
  const layout = useDeviceLayout();
  const timer = useRoundTimer();
  const phaseColor =
    timer.phase === 'work'
      ? colors.accent
      : timer.phase === 'rest'
        ? colors.green
        : timer.phase === 'finished'
          ? colors.yellow
          : colors.textMuted;

  return (
    <SafeAreaView style={styles.safe}>
      {timer.running ? <KeepAwakeOn /> : null}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          layout.isTV && styles.scrollTV,
        ]}
        scrollEnabled={!layout.isTV}
      >
        <View style={styles.topBar}>
          <BigButton label="Voltar" onPress={onBack} variant="ghost" />
          <Text style={styles.brand}>HEISHIKAN TIMER</Text>
          <View style={{ width: 88 }} />
        </View>

        <Text style={[styles.phase, { color: phaseColor, fontSize: 22 * layout.scale }]}>
          {PHASE_LABEL[timer.phase]}
        </Text>
        <Text style={[styles.round, { fontSize: 16 * layout.scale }]}>
          Round {Math.min(timer.round, timer.config.numRounds)} / {timer.config.numRounds}
        </Text>

        <Text
          style={[
            styles.clock,
            {
              fontSize: (layout.isTV ? 140 : 88) * Math.min(layout.scale, 1.2),
              color: phaseColor,
            },
          ]}
        >
          {timer.formatted}
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(timer.progress * 100)}%`, backgroundColor: phaseColor },
            ]}
          />
        </View>

        <View style={[styles.controls, layout.isTV && styles.controlsTV]}>
          <BigButton
            label={timer.running ? 'Pausar' : 'Iniciar'}
            onPress={timer.toggle}
            variant="primary"
            large={layout.isTV}
            style={styles.ctrlBtn}
          />
          <BigButton
            label="Reset"
            onPress={timer.softReset}
            large={layout.isTV}
            style={styles.ctrlBtn}
          />
        </View>

        <View style={styles.modes}>
          <Text style={styles.modesTitle}>Modos rápidos</Text>
          <View style={[styles.modeRow, layout.isTV && styles.modeRowTV]}>
            {DEFAULT_MODES.map((mode) => (
              <BigButton
                key={mode.name}
                label={mode.name}
                onPress={() => timer.applyMode(mode)}
                style={styles.modeBtn}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  scrollTV: {
    paddingHorizontal: 48,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brand: {
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 12,
  },
  phase: {
    textAlign: 'center',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  round: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  clock: {
    textAlign: 'center',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 28,
  },
  progressFill: {
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  controlsTV: {
    justifyContent: 'center',
  },
  ctrlBtn: {
    flex: 1,
    maxWidth: 280,
  },
  modes: {
    gap: 12,
  },
  modesTitle: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  modeRow: {
    gap: 10,
  },
  modeRowTV: {
    flexDirection: 'row',
  },
  modeBtn: {
    flex: 1,
  },
});
