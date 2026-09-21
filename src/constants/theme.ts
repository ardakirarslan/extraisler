/**
 * App-wide color palette. The app always renders in a bright, airy light
 * theme regardless of device color scheme — see `useTheme`.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#2C1810',
  background: '#F5F1E8',
  backgroundElement: '#F0EBE2',
  backgroundSelected: '#E9E2D7',
  textSecondary: '#6B5E55',
} as const;

export type ThemeColor = keyof typeof Colors;

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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const AccentColor = '#1B4332';
/** Distinct from AccentColor — reserved for primary creation CTAs (e.g. "Yeni İlan Oluştur"). */
export const CtaColor = '#D98E4A';

export const CardShadow = {
  shadowColor: '#2C1810',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

export const Radius = {
  card: 20,
  chip: 999,
  button: 16,
} as const;

/** Light tint of AccentColor — used for badge/chip/button backgrounds that pair with AccentColor text. */
export const AccentTint = 'rgba(27, 67, 50, 0.1)';
