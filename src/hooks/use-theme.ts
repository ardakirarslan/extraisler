import { Colors } from '@/constants/theme';

/** The app always renders in a single light theme, regardless of device color scheme. */
export function useTheme() {
  return Colors;
}
