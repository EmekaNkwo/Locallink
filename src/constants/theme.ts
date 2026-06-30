/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0B0D',
    textSecondary: '#6B6F76',
    background: '#F1F1F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E7EA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E4E4E8',
    tint: '#0B0B0D',
    tint2: '#00A88C',
    danger: '#E5484D',
    success: '#16A34A',
    warning: '#D97706',
  },
  dark: {
    text: '#F4F5F7',
    textSecondary: '#8A8D95',
    background: '#08080A',
    backgroundElement: '#161618',
    backgroundSelected: '#252529',
    surface: '#161618',
    surfaceElevated: '#1D1D20',
    border: '#272729',
    tint: '#F4F5F7',
    tint2: '#00E5B0',
    danger: '#FF5A5F',
    success: '#34D399',
    warning: '#FBBF24',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Linear-gradient strings consumed via `experimental_backgroundImage`.
 * Tuned for each scheme; access through `useGradients()`.
 */
export const Gradients = {
  light: {
    accent: 'linear-gradient(135deg, #00C9A7 0%, #0EA5E9 100%)',
    hero: 'linear-gradient(155deg, #FFFFFF 0%, #EEF3FC 100%)',
    danger: 'linear-gradient(135deg, #FF6B6B 0%, #E5484D 100%)',
    surface: 'linear-gradient(160deg, #FFFFFF 0%, #F1F4FB 100%)',
  },
  dark: {
    accent: 'linear-gradient(135deg, #00E5B0 0%, #2BB7F2 100%)',
    hero: 'linear-gradient(155deg, #19243F 0%, #0A1020 70%, #0A1424 100%)',
    danger: 'linear-gradient(135deg, #FF6271 0%, #B92D38 100%)',
    surface: 'linear-gradient(160deg, #141D32 0%, #0D1422 100%)',
  },
} as const;

export type GradientName = keyof typeof Gradients.light & keyof typeof Gradients.dark;

/** Corner radii scale. */
export const Radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Glow / elevation box-shadow strings (RN 0.81+ boxShadow). */
export const Glow = {
  tint: '0px 8px 28px rgba(0, 229, 176, 0.30)',
  tintSoft: '0px 6px 20px rgba(0, 229, 176, 0.18)',
  danger: '0px 8px 28px rgba(255, 90, 106, 0.32)',
  card: '0px 12px 30px rgba(0, 0, 0, 0.35)',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 100 }) ?? 0;
export const MaxContentWidth = 800;
