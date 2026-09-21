import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { Chip } from '@/components/chip';
import { RatingSummaryView } from '@/components/rating-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SERVICE_CATEGORIES } from '@/constants/master';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getOrCreateConversation } from '@/lib/conversations';
import { getErrorMessage } from '@/lib/errors';
import type { RatingSummary } from '@/lib/ratings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { MasterProfile, PublicUserInfo } from '@/types/database';

type MasterRow = MasterProfile & { user: PublicUserInfo | null; rating: RatingSummary };

async function loadMasters(category: string | null): Promise<MasterRow[]> {
  let query = supabase.from('master_profiles').select('*');
  if (category) query = query.contains('skills', [category]);
  const { data: masters, error } = await query;

  if (error || !masters) {
    console.warn('Failed to load masters:', error?.message);
    return [];
  }

  const userIds = masters.map((m) => m.user_id);
  const [{ data: users }, { data: ratings }] = userIds.length
    ? await Promise.all([
        supabase.from('public_user_info').select('*').in('id', userIds),
        supabase.from('ratings').select('rated_id, score').in('rated_id', userIds),
      ])
    : [{ data: [] as PublicUserInfo[] }, { data: [] as { rated_id: string; score: number }[] }];

  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const ratingsByUser = new Map<string, number[]>();
  for (const r of ratings ?? []) {
    const list = ratingsByUser.get(r.rated_id) ?? [];
    list.push(r.score);
    ratingsByUser.set(r.rated_id, list);
  }

  return masters.map((m) => {
    const scores = ratingsByUser.get(m.user_id) ?? [];
    const rating: RatingSummary = scores.length
      ? { average: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length }
      : { average: 0, count: 0 };
    return { ...m, user: userById.get(m.user_id) ?? null, rating };
  });
}

export default function MastersScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await loadMasters(categoryFilter);
      if (!cancelled) {
        setMasters(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryFilter]);

  const handleMessage = async (masterId: string) => {
    if (!userId) return;
    setMessagingId(masterId);
    try {
      const conversationId = await getOrCreateConversation(userId, masterId);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err) {
      console.warn('Failed to start conversation:', getErrorMessage(err, 'Mesaj başlatılamadı.'));
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={masters}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.filterRow}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={SERVICE_CATEGORIES as readonly string[]}
                keyExtractor={(c) => c}
                contentContainerStyle={styles.filterChips}
                renderItem={({ item: c }) => (
                  <Chip label={c} active={categoryFilter === c} onPress={() => setCategoryFilter(categoryFilter === c ? null : c)} />
                )}
              />
            </ThemedView>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="hammer-outline" size={32} color="#9AA0AC" />
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  Bu kategoride kayıtlı usta yok.
                </ThemedText>
              </ThemedView>
            ) : loading ? (
              <ActivityIndicator color={AccentColor} style={styles.loadingIndicator} />
            ) : null
          }
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <ThemedView style={styles.cardHeaderRow}>
                <ThemedView style={styles.avatar}>
                  <ThemedText type="smallBold" style={styles.avatarText}>
                    {(item.user?.name ?? '?').slice(0, 1).toUpperCase()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.cardTextBlock}>
                  <ThemedText type="default" style={styles.name}>
                    {item.user?.name ?? 'Usta'}
                  </ThemedText>
                  <RatingSummaryView summary={item.rating} />
                </ThemedView>
              </ThemedView>

              {item.skills?.length > 0 && (
                <ThemedView style={styles.skillsRow}>
                  {item.skills.map((skill) => (
                    <Badge key={skill} label={skill} tone="gray" />
                  ))}
                </ThemedView>
              )}

              {item.bio && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  {item.bio}
                </ThemedText>
              )}

              <Pressable
                style={[styles.messageButton, messagingId === item.user_id && styles.disabled]}
                disabled={messagingId === item.user_id}
                onPress={() => handleMessage(item.user_id)}>
                {messagingId === item.user_id ? (
                  <ActivityIndicator size="small" color={AccentColor} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={16} color={AccentColor} />
                    <ThemedText type="smallBold" style={styles.messageButtonText}>
                      Mesaj Gönder
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </ThemedView>
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
  filterRow: { marginBottom: Spacing.one, backgroundColor: 'transparent' },
  filterChips: { flexDirection: 'row', gap: 8 },
  loadingIndicator: { marginTop: Spacing.six },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AccentColor },
  cardTextBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  name: { fontWeight: '700' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'transparent' },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    borderRadius: Radius.button,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.6 },
  messageButtonText: { color: AccentColor },
});
