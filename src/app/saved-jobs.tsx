import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, CtaColor, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { loadSavedJobPosts, setJobSaved } from '@/lib/saved-jobs';
import { useAuth } from '@/providers/auth-provider';
import type { EmployerProfile, JobPost } from '@/types/database';

type JobPostWithEmployer = JobPost & { employer: EmployerProfile | null };

export default function SavedJobsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [jobs, setJobs] = useState<JobPostWithEmployer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const rows = await loadSavedJobPosts(userId);
      if (!cancelled) {
        setJobs(rows);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleRemove = (jobId: string) => {
    if (!userId) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setJobSaved(userId, jobId, false).catch((err) => {
      console.warn('Failed to remove saved job:', getErrorMessage(err, 'unknown error'));
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={AccentColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={32} color="#9AA0AC" />
              <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                Henüz kaydedilen ilanın yok. İlanlarda yer alan yer imi ikonuna dokunarak kaydedebilirsin.
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/jobs/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <ThemedView style={styles.imageWrap}>
                  {item.cover_photo_url ? (
                    <Image source={{ uri: item.cover_photo_url }} style={styles.image} contentFit="cover" transition={200} cachePolicy="disk" />
                  ) : (
                    <ThemedView style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#C0C4CC" />
                    </ThemedView>
                  )}
                  <ThemedView style={styles.imageScrim} />

                  <ThemedView style={styles.imageTopRow}>
                    <ThemedView style={[styles.durationBadge, { backgroundColor: item.duration_type === 'seasonal' ? AccentColor : CtaColor }]}>
                      <ThemedText type="small" style={styles.durationBadgeText}>
                        {item.duration_type === 'seasonal' ? 'Sezonluk' : 'Günlük'}
                      </ThemedText>
                    </ThemedView>
                    <Pressable style={styles.saveButton} onPress={() => handleRemove(item.id)} hitSlop={6}>
                      <Ionicons name="bookmark" size={16} color="#12141A" />
                    </Pressable>
                  </ThemedView>

                  {(item.district ?? item.employer?.location) && (
                    <ThemedView style={styles.imageBottomRow}>
                      <ThemedView style={styles.imageLocationChip}>
                        <Ionicons name="location" size={13} color={CtaColor} />
                        <ThemedText type="small" style={styles.imageLocationText}>
                          {item.district ?? item.employer?.location}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  )}
                </ThemedView>

                <ThemedView style={styles.cardBody}>
                  <ThemedView style={styles.cardTopRow}>
                    <ThemedView style={styles.cardTitleBlock}>
                      <ThemedText type="default" style={styles.cardTitle}>
                        {item.title}
                      </ThemedText>
                      {item.employer?.business_name && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.employer.business_name}
                        </ThemedText>
                      )}
                    </ThemedView>
                    <ThemedView style={styles.wageBlock}>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.wageLabel}>
                        {item.duration_type === 'seasonal' ? 'Aylık Ücret' : 'Günlük Ücret'}
                      </ThemedText>
                      <ThemedText type="smallBold" style={styles.wageValue}>
                        {item.daily_wage} ₺
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.cardFooter}>
                    <ThemedView style={styles.tagChip}>
                      <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.date}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.detailLink}>
                      <ThemedText type="smallBold" style={styles.detailLinkText}>
                        Detayları Gör
                      </ThemedText>
                      <Ionicons name="arrow-forward" size={14} color={CtaColor} />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            </Link>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.four, gap: Spacing.three },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    overflow: 'hidden',
    ...CardShadow,
  },
  cardPressed: { opacity: 0.9 },
  imageWrap: { height: 160, backgroundColor: '#F0EBE2' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(44, 24, 16, 0.42)',
  },
  imageTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.two,
    backgroundColor: 'transparent',
  },
  durationBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  durationBadgeText: { color: '#ffffff', fontWeight: '700' },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: Spacing.two,
    left: Spacing.two,
    right: Spacing.two,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  imageLocationChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  imageLocationText: { color: '#ffffff', fontWeight: '600' },
  cardBody: { padding: Spacing.three, gap: Spacing.two },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  cardTitleBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  cardTitle: { fontWeight: '700' },
  wageBlock: { alignItems: 'flex-end', backgroundColor: 'transparent' },
  wageLabel: { fontSize: 11 },
  wageValue: { color: AccentColor },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0EBE2',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2D8CB',
    backgroundColor: 'transparent',
  },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  detailLinkText: { color: CtaColor },
});
