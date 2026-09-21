import { supabase } from '@/lib/supabase';

export type RatingSummary = { average: number; count: number };

/** Fetches every rating a user has received and computes the average client-side (fine at this scale). */
export async function loadRatingSummary(userId: string): Promise<RatingSummary> {
  const { data } = await supabase.from('ratings').select('score').eq('rated_id', userId);
  const scores = data ?? [];
  if (scores.length === 0) return { average: 0, count: 0 };
  const total = scores.reduce((sum, r) => sum + r.score, 0);
  return { average: total / scores.length, count: scores.length };
}
