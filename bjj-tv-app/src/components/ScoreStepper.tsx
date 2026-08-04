import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme';

type Props = {
  label: string;
  value: number;
  onChange: (delta: number) => void;
  color?: string;
  compact?: boolean;
};

export function ScoreStepper({
  label,
  value,
  onChange,
  color = colors.green,
  compact,
}: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(-1)}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <View style={[styles.valueBox, { backgroundColor: color }]}>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Pressable
          onPress={() => onChange(1)}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    flex: 1,
  },
  compact: {
    minWidth: 100,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  btnText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  valueBox: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
  },
});
