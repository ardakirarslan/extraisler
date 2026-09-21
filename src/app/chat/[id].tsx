import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, Colors, Radius, Spacing } from '@/constants/theme';
import { markConversationRead } from '@/lib/messages';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Message, PublicUserInfo } from '@/types/database';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [otherUser, setOtherUser] = useState<PublicUserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError || !conversation) {
        console.warn('Failed to load conversation:', conversationError?.message);
        if (!cancelled) setLoading(false);
        return;
      }

      const otherUserId =
        conversation.participant_1_id === userId ? conversation.participant_2_id : conversation.participant_1_id;

      const [{ data: otherUserData }, { data: initialMessages, error: messagesError }] = await Promise.all([
        supabase.from('public_user_info').select('*').eq('id', otherUserId).maybeSingle(),
        supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
      ]);

      if (messagesError) console.warn('Failed to load messages:', messagesError.message);
      if (cancelled) return;
      setOtherUser(otherUserData);
      setMessages(initialMessages ?? []);
      setLoading(false);
      markConversationRead(conversationId, userId);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          if (newMessage.sender_id !== userId) markConversationRead(conversationId, userId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !userId) return;

    setDraft('');
    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, content });
    setSending(false);

    if (error) {
      console.warn('Failed to send message:', error.message);
      setDraft(content);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: otherUser?.name ?? 'Mesaj' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          {loading ? (
            <ThemedView style={styles.centered}>
              <ActivityIndicator color={AccentColor} />
            </ThemedView>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <ThemedView style={styles.emptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color="#9AA0AC" />
                  <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                    Henüz mesaj yok, ilk mesajı sen gönder.
                  </ThemedText>
                </ThemedView>
              }
              renderItem={({ item }) => {
                const isOwn = item.sender_id === userId;
                return (
                  <ThemedView style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
                    <ThemedView style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                      <ThemedText type="default" style={isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther}>
                        {item.content}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                );
              }}
            />
          )}

          <ThemedView style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Mesaj yaz..."
              placeholderTextColor="#9AA0AC"
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Pressable
              style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
              disabled={!draft.trim() || sending}
              onPress={handleSend}>
              <Ionicons name="send" size={18} color="#ffffff" />
            </Pressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.four, gap: Spacing.two, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  empty: { textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', backgroundColor: 'transparent' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: { backgroundColor: AccentColor, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleTextOwn: { color: '#ffffff' },
  bubbleTextOther: { color: Colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E5EC',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AccentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
