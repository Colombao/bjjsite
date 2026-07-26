import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useTimer } from '../hooks/useTimer';
import { usePlacar } from '../hooks/usePlacar';
import { Placar } from '../components/Placar';
import { tvStyles } from '../styles/tvStyles';
import { TVControls } from '../components/TVControls';

const styles = StyleSheet.create({
  container: tvStyles.container,
  header: tvStyles.header,
  headerTitle: tvStyles.headerTitle,
  headerSubtitle: tvStyles.headerSubtitle,
  content: {
    flex: 1,
  },
});

type FocusableItem =
  | 'atletaA-nome'
  | 'atletaA-team'
  | 'atletaA-p'
  | 'atletaA-v'
  | 'atletaA-pen'
  | 'atletaB-nome'
  | 'atletaB-team'
  | 'atletaB-p'
  | 'atletaB-v'
  | 'atletaB-pen'
  | 'timer-min'
  | 'timer-sec'
  | 'status-inicio'
  | 'status-durante'
  | 'status-final'
  | 'btn-start'
  | 'btn-reset';

export default function TVScreen() {
  const timer = useTimer(5);
  const { placar, updateAtleta, updateStatus, reset, addPonto, addVantagem, addPenalidade } =
    usePlacar();

  const [focusedItem, setFocusedItem] = useState<FocusableItem>('atletaA-nome');
  const [showControls, setShowControls] = useState(true);

  const focusableItems: FocusableItem[] = [
    'atletaA-nome',
    'atletaA-team',
    'atletaA-p',
    'atletaA-v',
    'atletaA-pen',
    'atletaB-nome',
    'atletaB-team',
    'atletaB-p',
    'atletaB-v',
    'atletaB-pen',
    'timer-min',
    'timer-sec',
    'status-inicio',
    'status-durante',
    'status-final',
    'btn-start',
    'btn-reset',
  ];

  const currentFocusIndex = focusableItems.indexOf(focusedItem);

  const handleKeyDown = (keyCode: number) => {
    // D-Pad Up
    if (keyCode === 19) {
      const newIndex = (currentFocusIndex - 1 + focusableItems.length) % focusableItems.length;
      setFocusedItem(focusableItems[newIndex]);
    }
    // D-Pad Down
    else if (keyCode === 20) {
      const newIndex = (currentFocusIndex + 1) % focusableItems.length;
      setFocusedItem(focusableItems[newIndex]);
    }
    // D-Pad Left
    else if (keyCode === 21) {
      handleFocusedItemAction('minus');
    }
    // D-Pad Right
    else if (keyCode === 22) {
      handleFocusedItemAction('plus');
    }
    // Center / Enter
    else if (keyCode === 23 || keyCode === 66) {
      handleFocusedItemAction('select');
    }
  };

  const handleFocusedItemAction = (action: 'plus' | 'minus' | 'select') => {
    const item = focusedItem;

    if (item.startsWith('atletaA-nome') || item.startsWith('atletaB-nome')) {
      // Name editable (would need TextInput)
    } else if (item.startsWith('atletaA-team') || item.startsWith('atletaB-team')) {
      // Team editable
    } else if (item === 'atletaA-p') {
      if (action === 'plus') addPonto('atletaA', 1);
      else if (action === 'minus') addPonto('atletaA', -1);
    } else if (item === 'atletaA-v') {
      if (action === 'plus') addVantagem('atletaA', 1);
      else if (action === 'minus') addVantagem('atletaA', -1);
    } else if (item === 'atletaA-pen') {
      if (action === 'plus') addPenalidade('atletaA', 1);
      else if (action === 'minus') addPenalidade('atletaA', -1);
    } else if (item === 'atletaB-p') {
      if (action === 'plus') addPonto('atletaB', 1);
      else if (action === 'minus') addPonto('atletaB', -1);
    } else if (item === 'atletaB-v') {
      if (action === 'plus') addVantagem('atletaB', 1);
      else if (action === 'minus') addVantagem('atletaB', -1);
    } else if (item === 'atletaB-pen') {
      if (action === 'plus') addPenalidade('atletaB', 1);
      else if (action === 'minus') addPenalidade('atletaB', -1);
    } else if (item === 'timer-min') {
      if (action === 'plus') timer.addMinute();
      else if (action === 'minus') timer.subtractMinute();
    } else if (item === 'status-inicio') {
      updateStatus('INÍCIO');
    } else if (item === 'status-durante') {
      updateStatus('DURANTE');
    } else if (item === 'status-final') {
      updateStatus('FINAL');
    } else if (item === 'btn-start') {
      timer.toggle();
    } else if (item === 'btn-reset') {
      timer.reset();
      reset();
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PLACAR JIU-JITSU</Text>
        <Text style={styles.headerSubtitle}>Padrão CBJJ</Text>
      </View>

      <Placar
        atletaA={placar.atletaA}
        atletaB={placar.atletaB}
        tempo={timer.formatted}
        statusLuta={placar.statusLuta}
        timerState={{
          formatted: timer.formatted,
          isRunning: timer.isRunning,
        }}
      />

      <TVControls
        placar={placar}
        timer={timer}
        focusedItem={focusedItem}
        onFocusChange={setFocusedItem}
        onUpdateAtleta={updateAtleta}
        onUpdateStatus={updateStatus}
        onAddPonto={addPonto}
        onAddVantagem={addVantagem}
        onAddPenalidade={addPenalidade}
        onTimerToggle={() => timer.toggle()}
        onTimerReset={() => timer.reset()}
        onReset={reset}
      />
    </ScrollView>
  );
}
