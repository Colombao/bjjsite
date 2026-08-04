import { Dimensions, Platform } from 'react-native';

export const colors = {
  bg: '#0B0A08',
  bgElevated: '#161411',
  bgPanel: '#1C1914',
  border: '#2E2A22',
  text: '#F2EDE4',
  textMuted: '#A39B8C',
  accent: '#C45C26',
  accentSoft: '#8B3F16',
  green: '#2F6B3A',
  yellow: '#C9A227',
  red: '#A83232',
  white: '#FFFFFF',
  black: '#000000',
};

export function useDeviceLayout() {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);
  const isLandscape = width > height;
  const isTV =
    Boolean(Platform.isTV) ||
    (isLandscape && shortest >= 600) ||
    width >= 1100;
  const isPhone = !isTV && shortest < 600;

  return {
    width,
    height,
    isLandscape,
    isTV,
    isPhone,
    scale: isTV ? 1.35 : 1,
  };
}
