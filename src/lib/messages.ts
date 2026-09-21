import { supabase } from '@/lib/supabase';

/** Counts unread messages across every conversation the user participates in. */
export async function countUnreadMessages(userId: string): Promise<number> {
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (!conversationIds.length) return 0;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .is('read_at', null);

  return count ?? 0;
}

/** Marks every unread message in a conversation (sent by the other participant) as read. */
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);
}
