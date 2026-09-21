import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MUGLA_DISTRICTS } from '@/constants/locations';
import { AccentColor, CardShadow, CtaColor, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { loadSavedJobIds, setJobSaved } from '@/lib/saved-jobs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { EmployerProfile, JobDurationType, JobPost } from '@/types/database';

type JobPostWithEmployer = JobPost & { employer: EmployerProfile | null };
type DurationFilter = 'all' | JobDurationType;

const DURATION_TABS: { key: DurationFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'seasonal', label: 'Sezonluk' },
  { key: 'daily', label: 'Günlük' },
];

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Dün yayınlandı';
  if (days < 30) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function JobsListScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { type } = useLocalSearchParams<{ type?: string }>();
  const initialDuration: DurationFilter = type === 'daily' || type === 'seasonal' ? type : 'all';

  const [durationFilter, setDurationFilter] = useState<DurationFilter>(initialDuration);
  const [jobs, setJobs] = useState<JobPostWithEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      let query = supabase.from('job_posts').select('*').eq('status', 'open').order('date', { ascending: true });
      if (durationFilter !== 'all') query = query.eq('duration_type', durationFilter);
      if (districtFilter) query = query.eq('district', districtFilter);
      const trimmedSearch = searchText.trim();
      if (trimmedSearch) query = query.or(`title.ilike.%${trimmedSearch}%,position.ilike.%${trimmedSearch}%`);
      const { data: posts, error } = await query;

      if (error || !posts) {
        console.warn('Failed to load job posts:', error?.message);
        if (!cancelled) {
          setJobs([]);
          setLoading(false);
        }
        return;
      }

      const employerIds = [...new Set(posts.map((p) => p.employer_id))];
      const { data: employers } = employerIds.length
        ? await supabase.from('employer_profiles').select('*').in('user_id', employerIds)
        : { data: [] as EmployerProfile[] };

      if (cancelled) return;
      const employerById = new Map((employers ?? []).map((e) => [e.user_id, e]));
      // Acil ilanlar en üstte gösterilir, geri kalanı tarihe göre sıralı kalır.
      const sorted = [...posts].sort((a, b) => Number(b.is_urgent) - Number(a.is_urgent));
      setJobs(sorted.map((p) => ({ ...p, employer: employerById.get(p.employer_id) ?? null })));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [durationFilter, districtFilter, searchText, refreshKey]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadSavedJobIds(userId).then((ids) => {
      if (!cancelled) setSavedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleSaved = (id: string) => {
    if (!userId) return;
    const next = !savedIds.has(id);
    setSavedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
    setJobSaved(userId, id, next).catch((err) => {
      console.warn('Failed to toggle saved job:', getErrorMessage(err, 'unknown error'));
      setSavedIds((prev) => {
        const reverted = new Set(prev);
        if (next) reverted.delete(id);
        else reverted.add(id);
        return reverted;
      });
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />}
          ListHeaderComponent={
            <ThemedView style={styles.filterRow}>
              <ThemedView style={styles.searchRow}>
                <ThemedView style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color="#9AA0AC" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Pozisyon, işletme veya ilçe ara..."
                    placeholderTextColor="#9AA0AC"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </ThemedView>
                <Pressable
                  style={styles.filterIconButton}
                  onPress={() => {
                    setSearchText('');
                    setDurationFilter('all');
                    setDistrictFilter(null);
                  }}
                  hitSlop={8}>
                  <Ionicons name="options-outline" size={18} color="#ffffff" />
                </Pressable>
              </ThemedView>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={DURATION_TABS}
                keyExtractor={(t) => t.key}
                contentContainerStyle={styles.filterChips}
                renderItem={({ item: t }) => (
                  <Chip label={t.label} active={durationFilter === t.key} onPress={() => setDurationFilter(t.key)} />
                )}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={MUGLA_DISTRICTS as readonly string[]}
                keyExtractor={(d) => d}
                contentContainerStyle={styles.filterChips}
                renderItem={({ item: d }) => (
                  <Chip label={d} active={districtFilter === d} onPress={() => setDistrictFilter(districtFilter === d ? null : d)} />
                )}
              />
            </ThemedView>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={32} color="#9AA0AC" />
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  Şu an açık ilan yok.
                </ThemedText>
              </ThemedView>
            ) : null
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
                    <ThemedView style={styles.imageTopBadges}>
                      <ThemedView style={[styles.durationBadge, { backgroundColor: item.duration_type === 'seasonal' ? AccentColor : CtaColor }]}>
                        <ThemedText type="small" style={styles.durationBadgeText}>
                          {item.duration_type === 'seasonal' ? 'Sezonluk' : 'Günlük'}
                        </ThemedText>
                      </ThemedView>
                      {item.is_urgent && (
                        <ThemedView style={styles.urgentBadge}>
                          <ThemedText type="small" style={styles.urgentBadgeText}>
                            Acil
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                    <Pressable style={styles.saveButton} onPress={() => toggleSaved(item.id)} hitSlop={6}>
                      <Ionicons name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'} size={16} color="#12141A" />
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

                  <ThemedView style={styles.tagsRow}>
                    <ThemedView style={styles.tagChip}>
                      <Ionicons name="people-outline" size={13} color="#6B7280" />
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.needed_worker_count} kişi
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.tagChip}>
                      <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.date}
                      </ThemedText>
                    </ThemedView>
                    {item.required_languages.length > 0 && (
                      <ThemedView style={styles.tagChip}>
                        <Ionicons name="language-outline" size={13} color="#6B7280" />
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.required_languages.join(', ')}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>

                  <ThemedView style={styles.cardFooter}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {timeAgo(item.created_at)}
                    </ThemedText>
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
  listContent: { padding: Spacing.four, gap: Spacing.three },
  filterRow: { marginBottom: Spacing.one, gap: Spacing.two, backgroundColor: 'transparent' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...CardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#12141A' },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.button,
    backgroundColor: AccentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChips: { flexDirection: 'row', gap: 8 },
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
  imageTopBadges: { flexDirection: 'row', gap: 6, backgroundColor: 'transparent' },
  durationBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  durationBadgeText: { color: '#ffffff', fontWeight: '700' },
  urgentBadge: { backgroundColor: '#B95045', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  urgentBadgeText: { color: '#ffffff', fontWeight: '700' },
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
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
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
