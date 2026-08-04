import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { HomeScreen } from './src/screens/HomeScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { PlacarScreen } from './src/screens/PlacarScreen';
import { useDeviceLayout } from './src/theme';

type Screen = 'home' | 'timer' | 'placar';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const layout = useDeviceLayout();

  useEffect(() => {
    // TV / landscape: libera rotação; celular no placar/timer pode girar
    ScreenOrientation.unlockAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (layout.isTV && (screen === 'timer' || screen === 'placar')) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
  }, [layout.isTV, screen]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden={layout.isTV} />
      {screen === 'home' && (
        <HomeScreen
          onOpenTimer={() => setScreen('timer')}
          onOpenPlacar={() => setScreen('placar')}
        />
      )}
      {screen === 'timer' && <TimerScreen onBack={() => setScreen('home')} />}
      {screen === 'placar' && <PlacarScreen onBack={() => setScreen('home')} />}
    </SafeAreaProvider>
  );
}
