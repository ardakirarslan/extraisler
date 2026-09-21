// Auth screens intentionally use a fixed light palette instead of the
// device color scheme. Letting them follow dark mode caused unreadable
// black-on-black inputs, since TextInput text/placeholder colors don't
// auto-invert like ThemedText does.
export const Colors = {
  pageBackground: '#F5F1E8',
  cardBackground: '#FCFBF8',
  inputBackground: '#F0EBE2',
  inputBorder: '#E2D8CB',
  textPrimary: '#2C1810',
  textSecondary: '#6B5E55',
  textPlaceholder: '#A69A8C',
  accent: '#D98E4A',
  error: '#B95045',
} as const;
