import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  green: { bg: '#D1FADF', fg: '#067647' },
  amber: { bg: '#FEF0C7', fg: '#B54708' },
  red: { bg: '#FEE4E2', fg: '#B42318' },
  blue: { bg: 'rgba(27, 67, 50, 0.1)', fg: '#1B4332' },
  gray: { bg: '#F0EBE2', fg: '#6B5E55' },
};

export function Badge({ label, tone = 'gray', style }: { label: string; tone?: BadgeTone; style?: ViewStyle }) {
  const colors = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <ThemedText type="small" style={[styles.text, { color: colors.fg }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '700', fontSize: 12, lineHeight: 16 },
});
