import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getOrCreateConversation } from '@/lib/conversations';
import { loadWorkerDocuments } from '@/lib/documents';
import { getErrorMessage } from '@/lib/errors';
import { shareJobToWhatsApp } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import { APPLICATION_STATUS, JOB_POST_STATUS } from '@/lib/status-labels';
import { useAuth } from '@/providers/auth-provider';
import type { Application, JobPost, JobPostStatus, PublicUserInfo, WorkerDocument } from '@/types/database';

type ApplicantRow = Application & { worker: PublicUserInfo | null };

async function loadApplicants(jobPostId: string): Promise<ApplicantRow[]> {
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('job_post_id', jobPostId)
    .order('applied_at', { ascending: false });

  if (error || !applications) {
    console.warn('Failed to load applicants:', error?.message);
    return [];
  }

  const workerIds = [...new Set(applications.map((a) => a.worker_id))];
  const { data: workers } = workerIds.length
    ? await supabase.from('public_user_info').select('*').in('id', workerIds)
    : { data: [] as PublicUserInfo[] };

  const workerById = new Map((workers ?? []).map((w) => [w.id, w]));
  return applications.map((a) => ({ ...a, worker: workerById.get(a.worker_id) ?? null }));
}

async function loadFavoriteIds(employerId: string): Promise<Set<string>> {
  const { data } = await supabase.from('favorite_workers').select('worker_id').eq('employer_id', employerId);
  return new Set((data ?? []).map((f) => f.worker_id));
}

async function loadRatedApplicationIds(employerId: string, applicationIds: string[]): Promise<Set<string>> {
  if (!applicationIds.length) return new Set();
  const { data } = await supabase
    .from('ratings')
    .select('application_id')
    .eq('rater_id', employerId)
    .in('application_id', applicationIds);
  return new Set((data ?? []).map((r) => r.application_id).filter((v): v is string => !!v));
}

export default function MyJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [job, setJob] = useState<JobPost | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [ratedApplicationIds, setRatedApplicationIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [favoritingId, setFavoritingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [documentsByWorker, setDocumentsByWorker] = useState<Map<string, WorkerDocument[]>>(new Map());
  const [expandedDocsWorkerId, setExpandedDocsWorkerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: jobData, error }, applicantRows, favIds] = await Promise.all([
        supabase.from('job_posts').select('*').eq('id', id).single(),
        loadApplicants(id),
        userId ? loadFavoriteIds(userId) : Promise.resolve(new Set<string>()),
      ]);

      if (cancelled) return;
      if (error || !jobData) {
        console.warn('Failed to load job post:', error?.message);
        setLoading(false);
        return;
      }
      setJob(jobData);
      setApplicants(applicantRows);
      setFavoriteIds(favIds);

      if (userId) {
        const rated = await loadRatedApplicationIds(userId, applicantRows.map((a) => a.id));
        if (!cancelled) setRatedApplicationIds(rated);
      }

      const workerIds = [...new Set(applicantRows.map((a) => a.worker_id))];
      if (workerIds.length) {
        const docsEntries = await Promise.all(workerIds.map(async (wid) => [wid, await loadWorkerDocuments(wid)] as const));
        if (!cancelled) setDocumentsByWorker(new Map(docsEntries));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  const handleToggleFavorite = async (workerId: string) => {
    if (!userId) return;
    setFavoritingId(workerId);
    const isFavorite = favoriteIds.has(workerId);
    const { error } = isFavorite
      ? await supabase.from('favorite_workers').delete().eq('employer_id', userId).eq('worker_id', workerId)
      : await supabase.from('favorite_workers').insert({ employer_id: userId, worker_id: workerId });
    setFavoritingId(null);

    if (error) {
      console.warn('Failed to toggle favorite:', error.message);
      return;
    }
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  };

  const handleDecision = async (applicationId: string, status: 'accepted' | 'rejected') => {
    setDecidingId(applicationId);
    const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId);
    setDecidingId(null);

    if (error) {
      console.warn('Failed to update application:', error.message);
      return;
    }
    setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  const handleMarkCompleted = async (applicationId: string) => {
    setCompletingId(applicationId);
    const { error } = await supabase
      .from('applications')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', applicationId);
    setCompletingId(null);

    if (error) {
      console.warn('Failed to mark application completed:', error.message);
      return;
    }
    setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: 'completed' } : a)));
  };

  const handleUpdateJobStatus = async (status: JobPostStatus) => {
    if (!job) return;
    setUpdatingStatus(true);
    const { error } = await supabase.from('job_posts').update({ status }).eq('id', job.id);
    setUpdatingStatus(false);

    if (error) {
      console.warn('Failed to update job status:', error.message);
      return;
    }
    setJob((prev) => (prev ? { ...prev, status } : prev));
  };

  const handleOpenDocument = (doc: WorkerDocument) => {
    Linking.openURL(doc.file_url).catch((err) => {
      console.warn('Failed to open document:', getErrorMessage(err, 'unknown error'));
    });
  };

  const handleMessage = async (workerId: string) => {
    if (!userId) return;
    setMessagingId(workerId);
    setMessageError(null);
    try {
      const conversationId = await getOrCreateConversation(userId, workerId);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err) {
      const message = getErrorMessage(err, 'Mesaj başlatılamadı.');
      console.warn('Failed to start conversation:', message);
      setMessageError(message);
    } finally {
      setMessagingId(null);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={AccentColor} />
      </ThemedView>
    );
  }

  if (!job) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="default">İlan bulunamadı.</ThemedText>
      </ThemedView>
    );
  }

  const jobStatusInfo = JOB_POST_STATUS[job.status];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.heroCard}>
            <ThemedView style={styles.heroHeaderRow}>
              {job.is_urgent && <Badge label="Acil" tone="red" />}
              <Badge label={jobStatusInfo.label} tone={jobStatusInfo.tone} />
              <Badge label={job.duration_type === 'daily' ? 'Günlük' : 'Sezonluk'} tone="blue" />
              <ThemedView style={styles.spacer} />
              <Pressable style={styles.shareButton} onPress={() => shareJobToWhatsApp(job)}>
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              </Pressable>
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              {job.title}
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              {job.date} · {job.daily_wage} ₺ · {job.needed_worker_count} kişi
            </ThemedText>

            {job.status === 'open' && (
              <ThemedView style={styles.jobStatusRow}>
                <Pressable
                  style={[styles.jobStatusButton, styles.jobStatusFilled]}
                  disabled={updatingStatus}
                  onPress={() => handleUpdateJobStatus('filled')}>
                  <ThemedText type="small" style={styles.jobStatusFilledText}>
                    Doldu Olarak İşaretle
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.jobStatusButton, styles.jobStatusClosed]}
                  disabled={updatingStatus}
                  onPress={() => handleUpdateJobStatus('closed')}>
                  <ThemedText type="small" style={styles.jobStatusClosedText}>
                    İlanı Kapat
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.jobStatusButton, styles.jobStatusCancelled]}
                  disabled={updatingStatus}
                  onPress={() => handleUpdateJobStatus('cancelled')}>
                  <ThemedText type="small" style={styles.jobStatusCancelledText}>
                    İptal Et
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold">Başvuranlar</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {applicants.length}
            </ThemedText>
          </ThemedView>

          {messageError && (
            <ThemedText type="small" style={styles.messageError}>
              {messageError}
            </ThemedText>
          )}

          {applicants.length === 0 && (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color="#9AA0AC" />
              <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                Bu ilana henüz başvuru yok.
              </ThemedText>
            </ThemedView>
          )}

          {applicants.map((a) => {
            const statusInfo = APPLICATION_STATUS[a.status];
            const showActions = a.status === 'pending';
            return (
              <ThemedView key={a.id} style={styles.applicantCard}>
                <ThemedView style={styles.applicantHeaderRow}>
                  <ThemedView style={styles.avatar}>
                    <ThemedText type="smallBold" style={styles.avatarText}>
                      {(a.worker?.name ?? '?').slice(0, 1).toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.applicantTextBlock}>
                    <ThemedText type="default" style={styles.applicantName}>
                      {a.worker?.name ?? 'Başvuran'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(a.applied_at).toLocaleDateString('tr-TR')}
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    disabled={favoritingId === a.worker_id}
                    onPress={() => handleToggleFavorite(a.worker_id)}
                    hitSlop={8}>
                    <Ionicons
                      name={favoriteIds.has(a.worker_id) ? 'star' : 'star-outline'}
                      size={20}
                      color={favoriteIds.has(a.worker_id) ? '#F5730B' : '#C0C4CC'}
                    />
                  </Pressable>
                  <Badge label={statusInfo.label} tone={statusInfo.tone} />
                </ThemedView>

                {(a.team_size ?? 1) > 1 && (
                  <ThemedView style={styles.teamBadgeRow}>
                    <Ionicons name="people" size={14} color={AccentColor} />
                    <ThemedText type="small" style={styles.teamBadgeText}>
                      {a.team_size} kişilik ekip{a.team_members?.length ? `: ${a.team_members.join(', ')}` : ''}
                    </ThemedText>
                  </ThemedView>
                )}

                <ThemedView style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionButton, styles.messageButton]}
                    disabled={messagingId === a.worker_id}
                    onPress={() => handleMessage(a.worker_id)}>
                    {messagingId === a.worker_id ? (
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
                  {(documentsByWorker.get(a.worker_id)?.length ?? 0) > 0 && (
                    <Pressable
                      style={[styles.actionButton, styles.docsButton]}
                      onPress={() => setExpandedDocsWorkerId(expandedDocsWorkerId === a.worker_id ? null : a.worker_id)}>
                      <Ionicons name="document-text-outline" size={16} color={AccentColor} />
                      <ThemedText type="smallBold" style={styles.messageButtonText}>
                        CV Görüntüle
                      </ThemedText>
                    </Pressable>
                  )}
                </ThemedView>

                {expandedDocsWorkerId === a.worker_id && (
                  <ThemedView style={styles.docsList}>
                    {(documentsByWorker.get(a.worker_id) ?? []).map((doc) => (
                      <Pressable key={doc.id} style={styles.docRow} onPress={() => handleOpenDocument(doc)}>
                        <Ionicons name="document-outline" size={16} color={AccentColor} />
                        <ThemedText type="small" style={styles.docRowText} numberOfLines={1}>
                          {doc.name}
                        </ThemedText>
                        <Ionicons name="open-outline" size={14} color="#9AA0AC" />
                      </Pressable>
                    ))}
                  </ThemedView>
                )}

                {showActions && (
                  <ThemedView style={styles.actionsRow}>
                    <Pressable
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={decidingId === a.id}
                      onPress={() => handleDecision(a.id, 'rejected')}>
                      <Ionicons name="close" size={16} color="#B42318" />
                      <ThemedText type="smallBold" style={styles.rejectButtonText}>
                        Reddet
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.acceptButton]}
                      disabled={decidingId === a.id}
                      onPress={() => handleDecision(a.id, 'accepted')}>
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                      <ThemedText type="smallBold" style={styles.acceptButtonText}>
                        Kabul Et
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                )}

                {a.status === 'accepted' && (
                  <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    disabled={completingId === a.id}
                    onPress={() => handleMarkCompleted(a.id)}>
                    {completingId === a.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                        <ThemedText type="smallBold" style={styles.acceptButtonText}>
                          Tamamlandı Olarak İşaretle
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                )}

                {a.status === 'completed' && !ratedApplicationIds.has(a.id) && (
                  <Link href={{ pathname: '/rate/[applicationId]', params: { applicationId: a.id } }} asChild>
                    <Pressable style={[styles.actionButton, styles.rateButton]}>
                      <Ionicons name="star-outline" size={16} color={AccentColor} />
                      <ThemedText type="smallBold" style={styles.messageButtonText}>
                        Değerlendir
                      </ThemedText>
                    </Pressable>
                  </Link>
                )}
              </ThemedView>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
    ...CardShadow,
  },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, backgroundColor: 'transparent' },
  spacer: { flex: 1, backgroundColor: 'transparent' },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F9EF',
  },
  title: { fontSize: 24, lineHeight: 28 },
  jobStatusRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent', marginTop: Spacing.one },
  jobStatusButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.button,
  },
  jobStatusFilled: { backgroundColor: 'rgba(27, 67, 50, 0.1)' },
  jobStatusFilledText: { color: AccentColor, fontWeight: '700' },
  jobStatusClosed: { backgroundColor: '#F2F3F7' },
  jobStatusClosedText: { color: '#6B7280', fontWeight: '700' },
  jobStatusCancelled: { backgroundColor: '#FEE4E2' },
  jobStatusCancelledText: { color: '#B42318', fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: Spacing.one,
  },
  messageError: { color: '#D92D20', textAlign: 'center' },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.five },
  empty: { textAlign: 'center' },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.three,
    ...CardShadow,
  },
  applicantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AccentColor },
  applicantTextBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  applicantName: { fontWeight: '700' },
  teamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    borderRadius: Radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  teamBadgeText: { color: AccentColor, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.button,
  },
  acceptButton: { backgroundColor: AccentColor },
  acceptButtonText: { color: '#ffffff' },
  rejectButton: { backgroundColor: '#FEE4E2' },
  rejectButtonText: { color: '#B42318' },
  messageButton: { backgroundColor: 'rgba(27, 67, 50, 0.1)' },
  messageButtonText: { color: AccentColor },
  docsButton: { backgroundColor: '#F2F3F7' },
  docsList: { gap: Spacing.one, backgroundColor: 'transparent' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F3F7',
    borderRadius: Radius.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docRowText: { flex: 1, color: AccentColor, fontWeight: '600' },
  rateButton: { backgroundColor: '#FEF0C7' },
});
