import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Conversation, PublicUserInfo } from '@/types/database';

type ConversationRow = Conversation & {
  otherUser: PublicUserInfo | null;
  lastMessagePreview: string | null;
};

export default function MessagesScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;

      (async () => {
        setLoading(true);
        const { data: convos, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error || !convos) {
          console.warn('Failed to load conversations:', error?.message);
          if (!cancelled) {
            setConversations([]);
            setLoading(false);
          }
          return;
        }

        const otherUserIds = [
          ...new Set(convos.map((c) => (c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id))),
        ];
        const conversationIds = convos.map((c) => c.id);

        const [usersRes, messagesRes] = await Promise.all([
          otherUserIds.length
            ? supabase.from('public_user_info').select('*').in('id', otherUserIds)
            : Promise.resolve({ data: [] as PublicUserInfo[] }),
          conversationIds.length
            ? supabase
                .from('messages')
                .select('conversation_id, content, created_at')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as { conversation_id: string; content: string; created_at: string }[] }),
        ]);

        if (cancelled) return;
        const userById = new Map((usersRes.data ?? []).map((u) => [u.id, u]));
        const lastMessageByConversation = new Map<string, string>();
        for (const m of messagesRes.data ?? []) {
          if (!lastMessageByConversation.has(m.conversation_id)) {
            lastMessageByConversation.set(m.conversation_id, m.content);
          }
        }

        setConversations(
          convos.map((c) => ({
            ...c,
            otherUser: userById.get(c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id) ?? null,
            lastMessagePreview: lastMessageByConversation.get(c.id) ?? null,
          })),
        );
        setLoading(false);
      })();

      return () => {
        cancelled = true;
      };
      // refreshKey isn't read above; bumping it forces this refetch from pull-to-refresh.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, refreshKey]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9AA0AC" />
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  Henüz bir konuşman yok.
                </ThemedText>
              </ThemedView>
            ) : null
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/chat/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <ThemedView style={styles.avatar}>
                  <ThemedText type="smallBold" style={styles.avatarText}>
                    {(item.otherUser?.name ?? '?').slice(0, 1).toUpperCase()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.cardTextBlock}>
                  <ThemedText type="default" style={styles.cardTitle}>
                    {item.otherUser?.name ?? 'Kullanıcı'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {item.lastMessagePreview ?? 'Henüz mesaj yok'}
                  </ThemedText>
                </ThemedView>
                <Ionicons name="chevron-forward" size={18} color="#C0C4CC" />
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
  listContent: { padding: Spacing.four, gap: Spacing.two },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    ...CardShadow,
  },
  cardPressed: { opacity: 0.85 },
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
  cardTitle: { fontWeight: '700' },
});
