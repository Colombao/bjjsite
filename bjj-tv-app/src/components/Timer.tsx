import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tvStyles } from '../styles/tvStyles';

interface TimerProps {
  formatted: string;
  isRunning: boolean;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  time: {
    fontSize: 64,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'monospace',
  },
  statusIndicator: {
    marginTop: 8,
    fontSize: 12,
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export const Timer = ({ formatted, isRunning }: TimerProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatted}</Text>
      {isRunning && <Text style={styles.statusIndicator}>RODANDO</Text>}
    </View>
  );
};
