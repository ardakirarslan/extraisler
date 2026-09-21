import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { JobDetailTheme as Theme } from '@/constants/job-detail-theme';
import { Spacing } from '@/constants/theme';

/** Generic placeholder for settings items that aren't built yet. */
export default function ComingSoonScreen() {
  const { title, icon } = useLocalSearchParams<{ title: string; icon?: keyof typeof Ionicons.glyphMap }>();

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: title ?? '' }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon ?? 'time-outline'} size={32} color={Theme.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Bu özellik yakında burada olacak.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Theme.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 18, fontWeight: '800', color: Theme.primary },
  subtitle: { fontSize: 14, color: Theme.mutedForeground, textAlign: 'center' },
});
