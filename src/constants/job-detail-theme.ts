/**
 * Palette for the job detail ("ilan") page, ported from the `job-detail-page`
 * design mock (Tailwind CSS variables) into RN style tokens. Scoped to this
 * page only — the rest of the app keeps its own theme in `constants/theme.ts`.
 */
export const JobDetailTheme = {
  background: '#F5F1E8',
  foreground: '#2C1810',
  primary: '#1B4332',
  primaryForeground: '#FCFBF8',
  secondary: '#E9E2D7',
  secondaryForeground: '#2C1810',
  muted: '#E8E2D8',
  mutedForeground: '#6B5E55',
  accent: '#D98E4A',
  accentForeground: '#2C1810',
  destructive: '#B95045',
  card: '#FCFBF8',
  border: '#E2D8CB',
  input: '#F0EBE2',
} as const;
