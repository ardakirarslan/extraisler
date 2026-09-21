import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MUGLA_DISTRICTS } from '@/constants/locations';
import { AccentColor, AccentTint, CardShadow, CtaColor, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { loadSavedJobIds, setJobSaved } from '@/lib/saved-jobs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { EmployerProfile, JobDurationType, JobPost, PublicUserInfo, ServiceRequest } from '@/types/database';

type Feed = 'seasonal' | 'daily' | 'service';

type JobFeedItem = JobPost & { employer: EmployerProfile | null };
type ServiceFeedItem = ServiceRequest & { requester: PublicUserInfo | null };

const FEED_TABS: { key: Feed; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'seasonal', icon: 'sunny-outline', label: 'Sezonluk' },
  { key: 'daily', icon: 'calendar-outline', label: 'Günlük' },
  { key: 'service', icon: 'hammer-outline', label: 'Usta Talebi' },
];

async function loadJobFeed(durationType: JobDurationType, district: string | null): Promise<JobFeedItem[]> {
  let query = supabase
    .from('job_posts')
    .select('*')
    .eq('status', 'open')
    .eq('duration_type', durationType)
    .order('is_urgent', { ascending: false })
    .order('date', { ascending: true })
    .limit(6);
  if (district) query = query.eq('district', district);

  const { data: posts, error } = await query;
  if (error || !posts) return [];

  const employerIds = [...new Set(posts.map((p) => p.employer_id))];
  const { data: employers } = employerIds.length
    ? await supabase.from('employer_profiles').select('*').in('user_id', employerIds)
    : { data: [] as EmployerProfile[] };
  const employerById = new Map((employers ?? []).map((e) => [e.user_id, e]));

  return posts.map((p) => ({ ...p, employer: employerById.get(p.employer_id) ?? null }));
}

async function loadServiceFeed(district: string | null): Promise<ServiceFeedItem[]> {
  let query = supabase
    .from('service_requests')
    .select('*')
    .eq('status', 'open')
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6);
  if (district) query = query.eq('location', district);

  const { data: requests, error } = await query;
  if (error || !requests) return [];

  const requesterIds = [...new Set(requests.map((r) => r.requester_id))];
  const { data: requesters } = requesterIds.length
    ? await supabase.from('public_user_info').select('*').in('id', requesterIds)
    : { data: [] as PublicUserInfo[] };
  const requesterById = new Map((requesters ?? []).map((u) => [u.id, u]));

  return requests.map((r) => ({ ...r, requester: requesterById.get(r.requester_id) ?? null }));
}

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const userId = session?.user.id;
  const isEmployer = profile?.role === 'employer';

  const [feed, setFeed] = useState<Feed>('seasonal');
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [counts, setCounts] = useState({ seasonal: 0, daily: 0, service: 0 });
  const [urgentCount, setUrgentCount] = useState(0);
  const [jobItems, setJobItems] = useState<JobFeedItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceFeedItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [dailyRes, seasonalRes, serviceRes] = await Promise.all([
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('duration_type', 'daily'),
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('duration_type', 'seasonal'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      if (!cancelled) {
        setCounts({ daily: dailyRes.count ?? 0, seasonal: seasonalRes.count ?? 0, service: serviceRes.count ?? 0 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      if (feed === 'service') {
        const [rows, urgentRes] = await Promise.all([
          loadServiceFeed(districtFilter),
          supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('is_urgent', true),
        ]);
        if (cancelled) return;
        setServiceItems(rows);
        setUrgentCount(urgentRes.count ?? 0);
      } else {
        const [rows, urgentRes] = await Promise.all([
          loadJobFeed(feed, districtFilter),
          supabase
            .from('job_posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open')
            .eq('duration_type', feed)
            .eq('is_urgent', true),
        ]);
        if (cancelled) return;
        setJobItems(rows);
        setUrgentCount(urgentRes.count ?? 0);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [feed, districtFilter, refreshKey]);

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

  const displayName = profile?.name || session?.user.email || '';
  const bannerTitle = feed === 'service' ? 'Bu Hafta Açılan Talepler' : 'Bu Hafta Başlayacak İşler';
  const bannerSubtitle =
    urgentCount > 0
      ? `${urgentCount} acil ${feed === 'service' ? 'talep' : 'ilan'} seni bekliyor`
      : 'Şu an acil işaretli bir ilan yok';
  const bannerHref = feed === 'service' ? ('/service-requests' as const) : { pathname: '/jobs' as const, params: { type: feed } };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />}>
          <ThemedView style={styles.headerRow}>
            <Pressable onPress={() => router.push('/my-profile')} hitSlop={4}>
              <ThemedView style={styles.avatar}>
                <ThemedText type="smallBold" style={styles.avatarText}>
                  {(displayName || 'K').slice(0, 1).toUpperCase()}
                </ThemedText>
              </ThemedView>
            </Pressable>
            <ThemedView style={styles.headerTextBlock}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.headerHint}>
                MERHABA
              </ThemedText>
              <ThemedText type="default" style={styles.headerName}>
                {displayName.split(' ')[0] || 'Hoş geldin'}
              </ThemedText>
            </ThemedView>
            <Pressable style={styles.headerButton} onPress={() => router.push('/jobs')} hitSlop={8}>
              <Ionicons name="search-outline" size={18} color={AccentColor} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => router.push('/masters')} hitSlop={8}>
              <Ionicons name="hammer-outline" size={18} color={AccentColor} />
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.tabsRow}>
            {FEED_TABS.map((tab) => {
              const active = feed === tab.key;
              const count = counts[tab.key];
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setFeed(tab.key)}>
                  <ThemedView style={styles.tabIconRow}>
                    <Ionicons name={tab.icon} size={15} color={active ? AccentColor : '#9AA0AC'} />
                    <ThemedText type="smallBold" style={[styles.tabLabel, active && styles.tabLabelActive]}>
                      {tab.label}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.tabCount}>
                    {count} {tab.key === 'service' ? 'Talep' : 'İlan'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['Tümü', ...MUGLA_DISTRICTS]}
            keyExtractor={(d) => d}
            contentContainerStyle={styles.districtChips}
            renderItem={({ item: d }) => (
              <Chip
                label={d}
                active={d === 'Tümü' ? districtFilter === null : districtFilter === d}
                onPress={() => setDistrictFilter(d === 'Tümü' ? null : d)}
              />
            )}
          />

          <Pressable onPress={() => router.push(bannerHref)}>
            <ThemedView style={styles.banner}>
              <ThemedView style={styles.bannerTextBlock}>
                {urgentCount > 0 && (
                  <ThemedView style={styles.bannerPill}>
                    <Ionicons name="flash" size={11} color="#ffffff" />
                    <ThemedText type="small" style={styles.bannerPillText}>
                      Acil İhtiyaç
                    </ThemedText>
                  </ThemedView>
                )}
                <ThemedText type="smallBold" style={styles.bannerTitle}>
                  {bannerTitle}
                </ThemedText>
                <ThemedText type="small" style={styles.bannerSubtitle}>
                  {bannerSubtitle}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.bannerButton}>
                <Ionicons name="arrow-forward" size={16} color={AccentColor} />
              </ThemedView>
            </ThemedView>
          </Pressable>

          {isEmployer && (
            <Pressable style={({ pressed }) => [styles.postJobButton, pressed && styles.pressed]} onPress={() => router.push('/post-job')}>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <ThemedText type="default" style={styles.postJobButtonText}>
                Yeni İş İlanı Oluştur
              </ThemedText>
            </Pressable>
          )}

          <ThemedView style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Öne Çıkan {feed === 'service' ? 'Talepler' : 'İlanlar'}
            </ThemedText>
          </ThemedView>

          {feed === 'service'
            ? serviceItems.map((item) => (
                <Pressable key={item.id} onPress={() => router.push({ pathname: '/service-requests/[id]', params: { id: item.id } })}>
                  <ThemedView style={styles.feedCard}>
                    <ThemedView style={styles.feedCardTopRow}>
                      <Badge label={item.category} tone="blue" />
                      {item.is_urgent && <Badge label="Acil" tone="red" />}
                    </ThemedView>
                    <ThemedText type="default" style={styles.feedCardTitle}>
                      {item.title}
                    </ThemedText>
                    {item.requester?.name && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.requester.name}
                      </ThemedText>
                    )}
                    <ThemedView style={styles.feedCardMetaRow}>
                      {item.location && (
                        <ThemedView style={styles.metaItem}>
                          <Ionicons name="location-outline" size={13} color="#9AA0AC" />
                          <ThemedText type="small" themeColor="textSecondary">
                            {item.location}
                          </ThemedText>
                        </ThemedView>
                      )}
                      {item.price != null && (
                        <ThemedText type="smallBold" style={styles.feedCardPrice}>
                          {item.price} ₺
                        </ThemedText>
                      )}
                    </ThemedView>
                  </ThemedView>
                </Pressable>
              ))
            : jobItems.map((item) => (
                <Pressable key={item.id} onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}>
                  <ThemedView style={styles.feedCard}>
                    <ThemedView style={styles.feedImageWrap}>
                      {item.cover_photo_url ? (
                        <Image source={{ uri: item.cover_photo_url }} style={styles.feedImage} contentFit="cover" transition={200} />
                      ) : (
                        <ThemedView style={styles.feedImagePlaceholder}>
                          <Ionicons name="image-outline" size={28} color="#C0C4CC" />
                        </ThemedView>
                      )}
                      <ThemedView style={styles.feedImageTopRow}>
                        <Badge label={item.duration_type === 'daily' ? 'Günlük' : `Sezonluk`} tone="blue" />
                        <Pressable style={styles.saveButton} onPress={() => toggleSaved(item.id)} hitSlop={6}>
                          <Ionicons name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'} size={16} color="#12141A" />
                        </Pressable>
                      </ThemedView>
                      {item.is_urgent && (
                        <ThemedView style={styles.feedImageBottomTag}>
                          <Ionicons name="flash" size={12} color="#ffffff" />
                          <ThemedText type="small" style={styles.feedImageBottomTagText}>
                            Acil
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                    <ThemedView style={styles.feedCardBody}>
                      <ThemedView style={styles.feedCardTopRow}>
                        <ThemedView style={styles.feedCardTitleBlock}>
                          <ThemedText type="default" style={styles.feedCardTitle}>
                            {item.title}
                          </ThemedText>
                          {item.employer?.business_name && (
                            <ThemedText type="small" themeColor="textSecondary">
                              {item.employer.business_name}
                            </ThemedText>
                          )}
                        </ThemedView>
                        <ThemedText type="smallBold" style={styles.feedCardPrice}>
                          {item.daily_wage} ₺
                        </ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.feedCardMetaRow}>
                        {(item.district ?? item.employer?.location) && (
                          <ThemedView style={styles.metaItem}>
                            <Ionicons name="location-outline" size={13} color="#9AA0AC" />
                            <ThemedText type="small" themeColor="textSecondary">
                              {item.district ?? item.employer?.location}
                            </ThemedText>
                          </ThemedView>
                        )}
                        <ThemedView style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={13} color="#9AA0AC" />
                          <ThemedText type="small" themeColor="textSecondary">
                            {item.date}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </Pressable>
              ))}

          {!loading && (feed === 'service' ? serviceItems.length === 0 : jobItems.length === 0) && (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="search-outline" size={28} color="#9AA0AC" />
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Bu filtrede henüz sonuç yok.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AccentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AccentColor },
  headerTextBlock: { flex: 1, gap: 1, backgroundColor: 'transparent' },
  headerHint: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  headerName: { fontWeight: '800', fontSize: 16 },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...CardShadow,
  },
  tabsRow: { flexDirection: 'row', backgroundColor: '#F0EBE2', borderRadius: 18, padding: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14 },
  tabActive: { backgroundColor: '#FFFFFF', ...CardShadow },
  tabIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'transparent' },
  tabLabel: { fontSize: 12, color: '#9AA0AC' },
  tabLabelActive: { color: AccentColor },
  tabCount: { fontSize: 10, marginTop: 2 },
  districtChips: { flexDirection: 'row', gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AccentColor,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  bannerTextBlock: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannerPillText: { color: CtaColor, fontWeight: '800', fontSize: 10 },
  bannerTitle: { color: '#ffffff', fontSize: 15 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)' },
  bannerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CtaColor,
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    shadowColor: CtaColor,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  postJobButtonText: { color: '#ffffff', fontWeight: '700' },
  pressed: { opacity: 0.85 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 16, color: AccentColor },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    ...CardShadow,
  },
  feedCardBody: { padding: Spacing.three, gap: Spacing.two },
  feedImageWrap: { height: 160, backgroundColor: '#F0EBE2' },
  feedImage: { width: '100%', height: '100%' },
  feedImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feedImageTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.two,
    backgroundColor: 'transparent',
  },
  saveButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedImageBottomTag: {
    position: 'absolute',
    bottom: Spacing.two,
    left: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(185,80,69,0.9)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedImageBottomTagText: { color: '#ffffff', fontWeight: '700' },
  feedCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two, backgroundColor: 'transparent' },
  feedCardTitleBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  feedCardTitle: { fontWeight: '700' },
  feedCardPrice: { color: AccentColor },
  feedCardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, backgroundColor: 'transparent' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.four, backgroundColor: 'transparent' },
  emptyText: { textAlign: 'center' },
});
