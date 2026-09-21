import { supabase } from '@/lib/supabase';

/** Finds the 1-1 conversation between two users, creating it if it doesn't exist yet. */
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_1_id.eq.${userId},participant_2_id.eq.${otherUserId}),` +
        `and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${userId})`,
    )
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  // The table has a check constraint requiring participant_1_id < participant_2_id
  // (canonical ordering, so the same pair never gets two rows) — sort before inserting.
  const [participant1, participant2] = [userId, otherUserId].sort();

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ participant_1_id: participant1, participant_2_id: participant2 })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}
