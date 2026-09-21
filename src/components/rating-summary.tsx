import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { RatingSummary } from '@/lib/ratings';

export function RatingSummaryView({ summary }: { summary: RatingSummary }) {
  if (summary.count === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Henüz değerlendirme yok
      </ThemedText>
    );
  }

  return (
    <View style={styles.row}>
      <Ionicons name="star" size={16} color="#F5730B" />
      <ThemedText type="smallBold">{summary.average.toFixed(1)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        ({summary.count} değerlendirme)
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
});
