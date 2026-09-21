import { supabase } from '@/lib/supabase';
import type { EmployerProfile, JobPost } from '@/types/database';

export async function loadSavedJobIds(workerId: string): Promise<Set<string>> {
  const { data } = await supabase.from('saved_jobs').select('job_post_id').eq('worker_id', workerId);
  return new Set((data ?? []).map((r) => r.job_post_id));
}

export async function setJobSaved(workerId: string, jobPostId: string, saved: boolean): Promise<void> {
  if (saved) {
    await supabase.from('saved_jobs').insert({ worker_id: workerId, job_post_id: jobPostId });
  } else {
    await supabase.from('saved_jobs').delete().eq('worker_id', workerId).eq('job_post_id', jobPostId);
  }
}

export async function loadSavedJobPosts(workerId: string): Promise<(JobPost & { employer: EmployerProfile | null })[]> {
  const { data: saved, error } = await supabase
    .from('saved_jobs')
    .select('job_post_id')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
  if (error || !saved?.length) return [];

  const jobIds = saved.map((s) => s.job_post_id);
  const { data: jobs } = await supabase.from('job_posts').select('*').in('id', jobIds);
  if (!jobs?.length) return [];

  const employerIds = [...new Set(jobs.map((j) => j.employer_id))];
  const { data: employers } = employerIds.length
    ? await supabase.from('employer_profiles').select('*').in('user_id', employerIds)
    : { data: [] as EmployerProfile[] };
  const employerById = new Map((employers ?? []).map((e) => [e.user_id, e]));

  // Keep the saved_jobs order (most-recently-saved first).
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  return jobIds
    .map((id) => jobById.get(id))
    .filter((j): j is JobPost => !!j)
    .map((j) => ({ ...j, employer: employerById.get(j.employer_id) ?? null }));
}
