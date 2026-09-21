import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, CtaColor, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { APPLICATION_STATUS, JOB_POST_STATUS } from '@/lib/status-labels';
import { useAuth } from '@/providers/auth-provider';
import type { ApplicationStatus, JobPost } from '@/types/database';

type WorkerApplicationRow = {
  id: string;
  jobTitle: string;
  jobDate: string;
  status: ApplicationStatus;
};

type WorkerInviteRow = {
  id: string;
  jobPostId: string;
  jobTitle: string;
  jobDate: string;
  dailyWage: number;
};

type EmployerJobRow = JobPost & { applicantCount: number };

async function loadWorkerInvites(userId: string): Promise<WorkerInviteRow[]> {
  const { data: invites, error } = await supabase
    .from('job_invites')
    .select('*')
    .eq('worker_id', userId)
    .eq('status', 'pending');

  if (error || !invites?.length) return [];

  const jobPostIds = [...new Set(invites.map((i) => i.job_post_id))];
  const { data: jobPosts } = await supabase.from('job_posts').select('*').in('id', jobPostIds);
  const jobById = new Map((jobPosts ?? []).map((j) => [j.id, j]));

  return invites
    .filter((i) => jobById.has(i.job_post_id))
    .map((i) => ({
      id: i.id,
      jobPostId: i.job_post_id,
      jobTitle: jobById.get(i.job_post_id)!.title,
      jobDate: jobById.get(i.job_post_id)!.date,
      dailyWage: jobById.get(i.job_post_id)!.daily_wage,
    }));
}

async function loadWorkerApplications(userId: string): Promise<WorkerApplicationRow[]> {
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('worker_id', userId)
    .order('applied_at', { ascending: false });

  if (error || !applications) {
    console.warn('Failed to load applications:', error?.message);
    return [];
  }

  const jobPostIds = [...new Set(applications.map((a) => a.job_post_id))];
  const { data: jobPosts } = jobPostIds.length
    ? await supabase.from('job_posts').select('*').in('id', jobPostIds)
    : { data: [] };

  const jobById = new Map((jobPosts ?? []).map((j) => [j.id, j]));

  return applications.map((a) => ({
    id: a.id,
    jobTitle: jobById.get(a.job_post_id)?.title ?? 'İlan',
    jobDate: jobById.get(a.job_post_id)?.date ?? '',
    status: a.status,
  }));
}

async function loadRatedApplicationIds(userId: string, applicationIds: string[]): Promise<Set<string>> {
  if (!applicationIds.length) return new Set();
  const { data } = await supabase
    .from('ratings')
    .select('application_id')
    .eq('rater_id', userId)
    .in('application_id', applicationIds);
  return new Set((data ?? []).map((r) => r.application_id).filter((v): v is string => !!v));
}

async function loadEmployerJobPosts(userId: string): Promise<EmployerJobRow[]> {
  const { data: jobPosts, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('employer_id', userId)
    .order('created_at', { ascending: false });

  if (error || !jobPosts) {
    console.warn('Failed to load job posts:', error?.message);
    return [];
  }

  const jobPostIds = jobPosts.map((j) => j.id);
  const { data: applications } = jobPostIds.length
    ? await supabase.from('applications').select('job_post_id').in('job_post_id', jobPostIds)
    : { data: [] as { job_post_id: string }[] };

  const countByJobPost = new Map<string, number>();
  for (const a of applications ?? []) {
    countByJobPost.set(a.job_post_id, (countByJobPost.get(a.job_post_id) ?? 0) + 1);
  }

  return jobPosts.map((j) => ({ ...j, applicantCount: countByJobPost.get(j.id) ?? 0 }));
}

export default function ApplicationsScreen() {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isEmployer = profile?.role === 'employer';

  const [workerRows, setWorkerRows] = useState<WorkerApplicationRow[]>([]);
  const [ratedApplicationIds, setRatedApplicationIds] = useState<Set<string>>(new Set());
  const [workerInvites, setWorkerInvites] = useState<WorkerInviteRow[]>([]);
  const [employerRows, setEmployerRows] = useState<EmployerJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;

      (async () => {
        setLoading(true);
        if (isEmployer) {
          const result = await loadEmployerJobPosts(userId);
          if (cancelled) return;
          setEmployerRows(result);
        } else {
          const [applications, invites] = await Promise.all([loadWorkerApplications(userId), loadWorkerInvites(userId)]);
          if (cancelled) return;
          setWorkerRows(applications);
          setWorkerInvites(invites);
          const rated = await loadRatedApplicationIds(userId, applications.map((a) => a.id));
          if (!cancelled) setRatedApplicationIds(rated);
        }
        setLoading(false);
      })();

      return () => {
        cancelled = true;
      };
      // refreshKey isn't read above; bumping it forces this refetch from pull-to-refresh.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, isEmployer, refreshKey]),
  );

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const handleInviteResponse = async (invite: WorkerInviteRow, accept: boolean) => {
    if (!userId) return;
    setRespondingId(invite.id);
    if (accept) {
      const { error: insertError } = await supabase
        .from('applications')
        .insert({ job_post_id: invite.jobPostId, worker_id: userId, status: 'accepted' });
      if (insertError) {
        console.warn('Failed to accept invite:', insertError.message);
        setRespondingId(null);
        return;
      }
    }
    const { error } = await supabase.from('job_invites').update({ status: accept ? 'accepted' : 'declined' }).eq('id', invite.id);
    setRespondingId(null);
    if (error) {
      console.warn('Failed to update invite:', error.message);
      return;
    }
    setWorkerInvites((prev) => prev.filter((i) => i.id !== invite.id));
    if (accept) setRefreshKey((k) => k + 1);
  };

  const header = (
    <ThemedView style={styles.header}>
      <ThemedText type="title" style={styles.headerTitle}>
        {isEmployer ? 'İlanlarım' : 'Başvurularım'}
      </ThemedText>
      {isEmployer && (
        <Link href="/post-job" asChild>
          <Pressable style={({ pressed }) => [styles.newJobButton, pressed && styles.cardPressed]}>
            <Ionicons name="add-circle" size={22} color="#ffffff" />
            <ThemedText type="default" style={styles.newJobButtonText}>
              Yeni İlan Oluştur
            </ThemedText>
          </Pressable>
        </Link>
      )}
    </ThemedView>
  );

  if (isEmployer) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <FlatList
            data={employerRows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={header}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
            ListEmptyComponent={
              !loading ? (
                <ThemedView style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={32} color="#9AA0AC" />
                  <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                    Henüz bir ilan oluşturmadın.
                  </ThemedText>
                </ThemedView>
              ) : null
            }
            renderItem={({ item }) => {
              const statusInfo = JOB_POST_STATUS[item.status];
              return (
                <Link href={{ pathname: '/my-jobs/[id]', params: { id: item.id } }} asChild>
                  <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                    <ThemedView style={styles.cardTopRow}>
                      <ThemedView style={styles.cardTitleBlock}>
                        <ThemedText type="default" style={styles.cardTitle}>
                          {item.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.date} · {item.daily_wage} ₺
                        </ThemedText>
                      </ThemedView>
                      <Badge label={statusInfo.label} tone={statusInfo.tone} />
                    </ThemedView>
                    <ThemedView style={styles.applicantRow}>
                      <Ionicons name="people-outline" size={16} color={AccentColor} />
                      <ThemedText type="smallBold" style={styles.applicantCount}>
                        {item.applicantCount} başvuru
                      </ThemedText>
                      <ThemedView style={styles.spacer} />
                      <Ionicons name="chevron-forward" size={18} color="#C0C4CC" />
                    </ThemedView>
                  </Pressable>
                </Link>
              );
            }}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={workerRows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.headerStack}>
              {header}
              {workerInvites.length > 0 && (
                <ThemedView style={styles.invitesSection}>
                  <ThemedText type="smallBold">İş Davetlerin</ThemedText>
                  {workerInvites.map((invite) => (
                    <ThemedView key={invite.id} style={styles.inviteCard}>
                      <ThemedView style={styles.cardTitleBlock}>
                        <ThemedText type="default" style={styles.cardTitle}>
                          {invite.jobTitle}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {invite.jobDate} · {invite.dailyWage} ₺
                        </ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.inviteActionsRow}>
                        <Pressable
                          style={[styles.inviteActionButton, styles.inviteDeclineButton]}
                          disabled={respondingId === invite.id}
                          onPress={() => handleInviteResponse(invite, false)}>
                          <ThemedText type="smallBold" style={styles.inviteDeclineText}>
                            Reddet
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          style={[styles.inviteActionButton, styles.inviteAcceptButton]}
                          disabled={respondingId === invite.id}
                          onPress={() => handleInviteResponse(invite, true)}>
                          <ThemedText type="smallBold" style={styles.inviteAcceptText}>
                            Kabul Et
                          </ThemedText>
                        </Pressable>
                      </ThemedView>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          }
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={32} color="#9AA0AC" />
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  Henüz bir başvurun yok.
                </ThemedText>
              </ThemedView>
            ) : null
          }
          renderItem={({ item }) => {
            const statusInfo = APPLICATION_STATUS[item.status];
            const canRate = item.status === 'completed' && !ratedApplicationIds.has(item.id);
            return (
              <ThemedView style={styles.card}>
                <ThemedView style={styles.cardTopRow}>
                  <ThemedView style={styles.cardTitleBlock}>
                    <ThemedText type="default" style={styles.cardTitle}>
                      {item.jobTitle}
                    </ThemedText>
                    {!!item.jobDate && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.jobDate}
                      </ThemedText>
                    )}
                  </ThemedView>
                  <Badge label={statusInfo.label} tone={statusInfo.tone} />
                </ThemedView>
                {canRate && (
                  <Link href={{ pathname: '/rate/[applicationId]', params: { applicationId: item.id } }} asChild>
                    <Pressable style={({ pressed }) => [styles.rateButton, pressed && styles.cardPressed]}>
                      <Ionicons name="star-outline" size={16} color={AccentColor} />
                      <ThemedText type="smallBold" style={styles.rateButtonText}>
                        Değerlendir
                      </ThemedText>
                    </Pressable>
                  </Link>
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
  listContent: { padding: Spacing.four, gap: Spacing.three },
  headerStack: { gap: Spacing.three, backgroundColor: 'transparent' },
  invitesSection: { gap: Spacing.two, backgroundColor: 'transparent' },
  inviteCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF0C7',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  inviteActionsRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  inviteActionButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.button },
  inviteDeclineButton: { backgroundColor: '#FEE4E2' },
  inviteDeclineText: { color: '#B42318' },
  inviteAcceptButton: { backgroundColor: AccentColor },
  inviteAcceptText: { color: '#ffffff' },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
    backgroundColor: 'transparent',
  },
  headerTitle: { fontSize: 26, lineHeight: 30 },
  newJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CtaColor,
    borderRadius: Radius.button,
    paddingVertical: 14,
    shadowColor: CtaColor,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  newJobButtonText: { color: '#ffffff', fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  cardPressed: { opacity: 0.85 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  cardTitleBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  cardTitle: { fontWeight: '700' },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  applicantCount: { color: AccentColor },
  spacer: { flex: 1, backgroundColor: 'transparent' },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.one,
    backgroundColor: '#FEF0C7',
    borderRadius: Radius.button,
    paddingVertical: 10,
  },
  rateButtonText: { color: AccentColor },
});
