import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, useDeviceLayout } from '../theme';
import { BigButton } from '../components/BigButton';
import { KeepAwakeOn } from '../components/KeepAwakeOn';
import { ScoreStepper } from '../components/ScoreStepper';
import { usePlacar } from '../hooks/usePlacar';
import { useMatchTimer } from '../hooks/useMatchTimer';

type Props = {
  onBack: () => void;
};

export function PlacarScreen({ onBack }: Props) {
  const layout = useDeviceLayout();
  const { placar, updateAtleta, bump, updateStatus, reset } = usePlacar();
  const timer = useMatchTimer(300);
  const [showControls, setShowControls] = useState(!layout.isTV);

  return (
    <SafeAreaView style={styles.safe}>
      {timer.running ? <KeepAwakeOn /> : null}
      <ScrollView
        contentContainerStyle={[styles.scroll, layout.isTV && styles.scrollTV]}
        scrollEnabled={showControls || !layout.isTV}
      >
        <View style={styles.topBar}>
          <BigButton label="Voltar" onPress={onBack} variant="ghost" />
          <Text style={styles.brand}>HEISHIKAN PLACAR</Text>
          <BigButton
            label={showControls ? 'Tela' : 'Ctrl'}
            onPress={() => setShowControls((v) => !v)}
            variant="ghost"
          />
        </View>

        <View style={[styles.board, layout.isTV && styles.boardTV]}>
          <AthleteColumn
            side="A"
            nome={placar.atletaA.nome}
            team={placar.atletaA.team}
            pontos={placar.atletaA.pontos}
            vantagem={placar.atletaA.vantagem}
            penalidade={placar.atletaA.penalidade}
            scale={layout.scale}
            isTV={layout.isTV}
          />
          <View style={styles.centerCol}>
            <Text style={[styles.clock, { fontSize: (layout.isTV ? 72 : 48) * layout.scale }]}>
              {timer.formatted}
            </Text>
            <Text style={[styles.status, { fontSize: 16 * layout.scale }]}>
              {placar.statusLuta}
            </Text>
          </View>
          <AthleteColumn
            side="B"
            nome={placar.atletaB.nome}
            team={placar.atletaB.team}
            pontos={placar.atletaB.pontos}
            vantagem={placar.atletaB.vantagem}
            penalidade={placar.atletaB.penalidade}
            scale={layout.scale}
            isTV={layout.isTV}
          />
        </View>

        {showControls ? (
          <View style={styles.controls}>
            <AthleteControls
              title="Atleta A"
              nome={placar.atletaA.nome}
              team={placar.atletaA.team}
              pontos={placar.atletaA.pontos}
              vantagem={placar.atletaA.vantagem}
              penalidade={placar.atletaA.penalidade}
              onNome={(v) => updateAtleta('atletaA', 'nome', v)}
              onTeam={(v) => updateAtleta('atletaA', 'team', v)}
              onPontos={(d) => bump('atletaA', 'pontos', d)}
              onVantagem={(d) => bump('atletaA', 'vantagem', d)}
              onPenalidade={(d) => bump('atletaA', 'penalidade', d)}
            />
            <AthleteControls
              title="Atleta B"
              nome={placar.atletaB.nome}
              team={placar.atletaB.team}
              pontos={placar.atletaB.pontos}
              vantagem={placar.atletaB.vantagem}
              penalidade={placar.atletaB.penalidade}
              onNome={(v) => updateAtleta('atletaB', 'nome', v)}
              onTeam={(v) => updateAtleta('atletaB', 'team', v)}
              onPontos={(d) => bump('atletaB', 'pontos', d)}
              onVantagem={(d) => bump('atletaB', 'vantagem', d)}
              onPenalidade={(d) => bump('atletaB', 'penalidade', d)}
            />

            <View style={styles.timerRow}>
              <BigButton
                label={timer.running ? 'Pausar' : 'Timer'}
                onPress={() => {
                  timer.toggle();
                  if (!timer.running) updateStatus('DURANTE');
                }}
                variant="primary"
                style={{ flex: 1 }}
              />
              <BigButton label="+1 min" onPress={() => timer.addMinute(1)} style={{ flex: 1 }} />
              <BigButton label="−1 min" onPress={() => timer.addMinute(-1)} style={{ flex: 1 }} />
              <BigButton
                label="5:00"
                onPress={() => {
                  timer.setMinutes(5);
                  updateStatus('INÍCIO');
                }}
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.timerRow}>
              <BigButton label="Início" onPress={() => updateStatus('INÍCIO')} style={{ flex: 1 }} />
              <BigButton label="Durante" onPress={() => updateStatus('DURANTE')} style={{ flex: 1 }} />
              <BigButton
                label="Final"
                onPress={() => {
                  updateStatus('FINAL');
                  if (timer.running) timer.toggle();
                }}
                style={{ flex: 1 }}
              />
              <BigButton
                label="Zerar"
                onPress={() => {
                  reset();
                  timer.reset();
                }}
                variant="danger"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AthleteColumn({
  side,
  nome,
  team,
  pontos,
  vantagem,
  penalidade,
  scale,
  isTV,
}: {
  side: 'A' | 'B';
  nome: string;
  team: string;
  pontos: number;
  vantagem: number;
  penalidade: number;
  scale: number;
  isTV: boolean;
}) {
  return (
    <View style={[styles.athlete, isTV && styles.athleteTV]}>
      <Text style={[styles.nome, { fontSize: (isTV ? 32 : 20) * scale }]} numberOfLines={1}>
        {nome}
      </Text>
      <Text style={styles.team} numberOfLines={1}>
        {team}
      </Text>
      <View style={[styles.scoreRow, side === 'B' && styles.scoreRowReverse]}>
        <ScoreChip value={pontos} color={colors.green} big scale={scale} />
        <ScoreChip value={vantagem} color={colors.yellow} scale={scale} />
        <ScoreChip value={penalidade} color={colors.red} scale={scale} />
      </View>
      <View style={styles.legendRow}>
        <Text style={styles.legend}>P</Text>
        <Text style={styles.legend}>V</Text>
        <Text style={styles.legend}>Pen</Text>
      </View>
    </View>
  );
}

function ScoreChip({
  value,
  color,
  big,
  scale,
}: {
  value: number;
  color: string;
  big?: boolean;
  scale: number;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: color },
        big && styles.chipBig,
        { minWidth: (big ? 88 : 56) * scale, minHeight: (big ? 88 : 56) * scale },
      ]}
    >
      <Text style={[styles.chipText, { fontSize: (big ? 48 : 28) * scale }]}>{value}</Text>
    </View>
  );
}

function AthleteControls({
  title,
  nome,
  team,
  pontos,
  vantagem,
  penalidade,
  onNome,
  onTeam,
  onPontos,
  onVantagem,
  onPenalidade,
}: {
  title: string;
  nome: string;
  team: string;
  pontos: number;
  vantagem: number;
  penalidade: number;
  onNome: (v: string) => void;
  onTeam: (v: string) => void;
  onPontos: (d: number) => void;
  onVantagem: (d: number) => void;
  onPenalidade: (d: number) => void;
}) {
  return (
    <View style={styles.ctrlCard}>
      <Text style={styles.ctrlTitle}>{title}</Text>
      <TextInput
        value={nome}
        onChangeText={onNome}
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        value={team}
        onChangeText={onTeam}
        style={styles.input}
        placeholder="Equipe"
        placeholderTextColor={colors.textMuted}
      />
      <View style={styles.steppers}>
        <ScoreStepper label="Pontos" value={pontos} onChange={onPontos} color={colors.green} />
        <ScoreStepper label="Vant." value={vantagem} onChange={onVantagem} color={colors.yellow} />
        <ScoreStepper label="Pen." value={penalidade} onChange={onPenalidade} color={colors.red} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  scrollTV: { paddingHorizontal: 40, flexGrow: 1, justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 12,
  },
  board: {
    backgroundColor: colors.bgPanel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  boardTV: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    minHeight: 360,
  },
  athlete: { gap: 6 },
  athleteTV: { flex: 1 },
  nome: {
    color: colors.text,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  team: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  scoreRowReverse: {},
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginTop: 4,
  },
  legend: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  chip: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipBig: {},
  chipText: {
    color: colors.white,
    fontWeight: '800',
  },
  centerCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 140,
  },
  clock: {
    color: colors.text,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  status: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 6,
  },
  controls: { gap: 14 },
  ctrlCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  ctrlTitle: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  steppers: {
    flexDirection: 'row',
    gap: 8,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
