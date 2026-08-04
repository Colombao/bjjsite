import { useKeepAwake } from 'expo-keep-awake';

/** Mantém a tela ligada enquanto montado (timer/placar em execução). */
export function KeepAwakeOn() {
  useKeepAwake();
  return null;
}
