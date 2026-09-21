/**
 * Extracts a readable message from a caught error. Supabase/PostgREST errors
 * are plain `{ message, details, hint, code }` objects — NOT `Error`
 * instances — so `err instanceof Error` misses them and silently falls back
 * to a generic message, hiding the real reason (e.g. an RLS policy denial).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}
