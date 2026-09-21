import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getOrCreateConversation } from '@/lib/conversations';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { JobPost, PublicUserInfo } from '@/types/database';

type FavoriteRow = { worker_id: string; worker: PublicUserInfo | null };

export default function FavoritesScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [openJobs, setOpenJobs] = useState<JobPost[]>([]);
  const [invitedPairs, setInvitedPairs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: favRows }, { data: jobs }, { data: invites }] = await Promise.all([
        supabase.from('favorite_workers').select('worker_id').eq('employer_id', userId),
        supabase.from('job_posts').select('*').eq('employer_id', userId).eq('status', 'open'),
        supabase.from('job_invites').select('job_post_id, worker_id').eq('employer_id', userId),
      ]);

      if (cancelled) return;

      const workerIds = (favRows ?? []).map((f) => f.worker_id);
      const { data: workers } = workerIds.length
        ? await supabase.from('public_user_info').select('*').in('id', workerIds)
        : { data: [] as PublicUserInfo[] };

      if (cancelled) return;
      const workerById = new Map((workers ?? []).map((w) => [w.id, w]));
      setFavorites((favRows ?? []).map((f) => ({ worker_id: f.worker_id, worker: workerById.get(f.worker_id) ?? null })));
      setOpenJobs(jobs ?? []);
      setInvitedPairs(new Set((invites ?? []).map((i) => `${i.job_post_id}:${i.worker_id}`)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleMessage = async (workerId: string) => {
    if (!userId) return;
    setBusyKey(`msg:${workerId}`);
    try {
      const conversationId = await getOrCreateConversation(userId, workerId);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err) {
      console.warn('Failed to start conversation:', err instanceof Error ? err.message : err);
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemoveFavorite = async (workerId: string) => {
    if (!userId) return;
    setBusyKey(`remove:${workerId}`);
    const { error } = await supabase.from('favorite_workers').delete().eq('employer_id', userId).eq('worker_id', workerId);
    setBusyKey(null);
    if (error) {
      console.warn('Failed to remove favorite:', error.message);
      return;
    }
    setFavorites((prev) => prev.filter((f) => f.worker_id !== workerId));
  };

  const handleInvite = async (jobPostId: string, workerId: string) => {
    if (!userId) return;
    setBusyKey(`invite:${jobPostId}:${workerId}`);
    const { error } = await supabase.from('job_invites').insert({ job_post_id: jobPostId, employer_id: userId, worker_id: workerId });
    setBusyKey(null);
    if (error) {
      console.warn('Failed to send invite:', error.message);
      return;
    }
    setInvitedPairs((prev) => new Set(prev).add(`${jobPostId}:${workerId}`));
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
          data={favorites}
          keyExtractor={(item) => item.worker_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <Ionicons name="star-outline" size={32} color="#9AA0AC" />
              <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                Henüz favori personelin yok. İlan başvurularında yıldız ikonuna dokunarak ekleyebilirsin.
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => {
            const isExpanded = expandedWorkerId === item.worker_id;
            return (
              <ThemedView style={styles.card}>
                <ThemedView style={styles.cardHeaderRow}>
                  <ThemedView style={styles.avatar}>
                    <ThemedText type="smallBold" style={styles.avatarText}>
                      {(item.worker?.name ?? '?').slice(0, 1).toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="default" style={styles.name}>
                    {item.worker?.name ?? 'Personel'}
                  </ThemedText>
                  <Pressable
                    disabled={busyKey === `remove:${item.worker_id}`}
                    onPress={() => handleRemoveFavorite(item.worker_id)}
                    hitSlop={8}>
                    <Ionicons name="star" size={20} color="#F5730B" />
                  </Pressable>
                </ThemedView>

                <ThemedView style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionButton, styles.messageButton]}
                    disabled={busyKey === `msg:${item.worker_id}`}
                    onPress={() => handleMessage(item.worker_id)}>
                    <Ionicons name="chatbubble-outline" size={16} color={AccentColor} />
                    <ThemedText type="smallBold" style={styles.messageButtonText}>
                      Mesaj
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.inviteButton]}
                    onPress={() => setExpandedWorkerId(isExpanded ? null : item.worker_id)}>
                    <Ionicons name="briefcase-outline" size={16} color="#ffffff" />
                    <ThemedText type="smallBold" style={styles.inviteButtonText}>
                      İşe Davet Et
                    </ThemedText>
                  </Pressable>
                </ThemedView>

                {isExpanded && (
                  <ThemedView style={styles.jobPickList}>
                    {openJobs.length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Açık ilanın yok. Önce bir ilan oluştur.
                      </ThemedText>
                    ) : (
                      openJobs.map((job) => {
                        const key = `${job.id}:${item.worker_id}`;
                        const invited = invitedPairs.has(key);
                        return (
                          <Pressable
                            key={job.id}
                            style={[styles.jobPickRow, invited && styles.jobPickRowDisabled]}
                            disabled={invited || busyKey === `invite:${key}`}
                            onPress={() => handleInvite(job.id, item.worker_id)}>
                            <ThemedText type="small" style={styles.jobPickTitle}>
                              {job.title}
                            </ThemedText>
                            <ThemedText type="small" style={invited ? styles.jobPickInvited : styles.jobPickCta}>
                              {invited ? 'Davet gönderildi' : 'Davet et'}
                            </ThemedText>
                          </Pressable>
                        );
                      })
                    )}
                  </ThemedView>
                )}
              </ThemedView>
            );
          }}
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
    padding: Spacing.three,
    gap: Spacing.three,
    ...CardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AccentColor },
  name: { flex: 1, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.button,
  },
  messageButton: { backgroundColor: 'rgba(27, 67, 50, 0.1)' },
  messageButtonText: { color: AccentColor },
  inviteButton: { backgroundColor: AccentColor },
  inviteButtonText: { color: '#ffffff' },
  jobPickList: { gap: Spacing.one, backgroundColor: 'transparent' },
  jobPickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F3F7',
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  jobPickRowDisabled: { opacity: 0.6 },
  jobPickTitle: { fontWeight: '600' },
  jobPickCta: { color: AccentColor, fontWeight: '700' },
  jobPickInvited: { color: '#6B7280' },
});
