/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function resolveScheme(scheme: ReturnType<typeof useColorScheme>) {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useColorScheme();
  return Colors[resolveScheme(scheme)];
}

export function useGradients() {
  const scheme = useColorScheme();
  return Gradients[resolveScheme(scheme)];
}

export function useIsDark() {
  return useColorScheme() === 'dark';
}
