import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, useDeviceLayout } from '../theme';

type Props = {
  onOpenTimer: () => void;
  onOpenPlacar: () => void;
};

export function HomeScreen({ onOpenTimer, onOpenPlacar }: Props) {
  const { isTV, scale } = useDeviceLayout();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.bgGlow, isTV && styles.bgGlowTV]} />
      <View style={styles.content}>
        <Text style={[styles.brand, { fontSize: 42 * scale }]}>HEISHIKAN</Text>
        <Text style={[styles.tag, { fontSize: 14 * scale }]}>
          Timer & Placar · Academia
        </Text>
        <Text style={[styles.headline, { fontSize: (isTV ? 28 : 20) * scale }]}>
          Um app para a TV e o celular no tatame
        </Text>

        <View style={[styles.actions, isTV && styles.actionsTV]}>
          <Pressable
            onPress={onOpenTimer}
            style={({ pressed }) => [
              styles.card,
              isTV && styles.cardTV,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.cardEyebrow}>Treino</Text>
            <Text style={[styles.cardTitle, { fontSize: 28 * scale }]}>Timer</Text>
            <Text style={styles.cardDesc}>
              Rounds, preparação e descanso — modo tela cheia para TV
            </Text>
          </Pressable>

          <Pressable
            onPress={onOpenPlacar}
            style={({ pressed }) => [
              styles.card,
              isTV && styles.cardTV,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.cardEyebrow}>Luta</Text>
            <Text style={[styles.cardTitle, { fontSize: 28 * scale }]}>Placar</Text>
            <Text style={styles.cardDesc}>
              Pontos, vantagens e penalidades no padrão CBJJ
            </Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          {isTV
            ? 'Use o controle remoto ou toque para navegar'
            : 'No iPhone/Android: instale pela App Store / Play Store ou Expo Go'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgGlow: {
    position: 'absolute',
    top: -80,
    left: -40,
    right: -40,
    height: 280,
    backgroundColor: colors.accentSoft,
    opacity: 0.22,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  bgGlowTV: {
    height: 360,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  brand: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  tag: {
    color: colors.accent,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 36,
    lineHeight: 30,
  },
  actions: {
    gap: 16,
  },
  actionsTV: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 22,
  },
  cardTV: {
    flex: 1,
    maxWidth: 420,
    minHeight: 220,
    padding: 32,
  },
  cardPressed: {
    borderColor: colors.accent,
    opacity: 0.92,
  },
  cardEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDesc: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    marginTop: 28,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
  },
});
