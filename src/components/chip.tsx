import { Pressable, StyleSheet, Text } from 'react-native';

import { AccentColor } from '@/constants/theme';

/** Small toggle chip used for district/language pickers and filter rows. */
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2D8CB',
    backgroundColor: '#F0EBE2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { borderColor: AccentColor, backgroundColor: 'rgba(27, 67, 50, 0.1)' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B5E55' },
  chipTextActive: { color: AccentColor },
});
