import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobDetailTheme as Theme } from '@/constants/job-detail-theme';
import { Spacing } from '@/constants/theme';
import { getOrCreateConversation } from '@/lib/conversations';
import { getErrorMessage } from '@/lib/errors';
import { loadSavedJobIds, setJobSaved } from '@/lib/saved-jobs';
import { shareJobToWhatsApp } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import { APPLICATION_STATUS, JOB_POST_STATUS } from '@/lib/status-labels';
import { useAuth } from '@/providers/auth-provider';
import type { Application, EmployerProfile, JobPost } from '@/types/database';

// Bigger, screen-proportional hero photo (capped so it doesn't get huge on tablets).
const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_IMAGE_HEIGHT = Math.min(360, Math.round((SCREEN_WIDTH - Spacing.three * 2) * 0.85));

function Pill({ label, tone }: { label: string; tone: 'primary' | 'destructive' | 'muted' }) {
  const colors = {
    primary: { bg: 'rgba(27, 67, 50, 0.1)', fg: Theme.primary },
    destructive: { bg: 'rgba(185, 80, 69, 0.12)', fg: Theme.destructive },
    muted: { bg: Theme.muted, fg: Theme.mutedForeground },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.pillText, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue}>{value}</Text>
    </View>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const userId = session?.user.id;

  const [job, setJob] = useState<JobPost | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [applyAsTeam, setApplyAsTeam] = useState(false);
  const [teamMembersInput, setTeamMembersInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: jobData, error } = await supabase.from('job_posts').select('*').eq('id', id).single();
      if (error || !jobData) {
        console.warn('Failed to load job post:', error?.message);
        if (!cancelled) setLoading(false);
        return;
      }

      const [{ data: employerData }, { data: applicationData }] = await Promise.all([
        supabase.from('employer_profiles').select('*').eq('user_id', jobData.employer_id).maybeSingle(),
        userId
          ? supabase.from('applications').select('*').eq('job_post_id', id).eq('worker_id', userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!cancelled) {
        setJob(jobData);
        setEmployer(employerData);
        setMyApplication(applicationData);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadSavedJobIds(userId).then((ids) => {
      if (!cancelled) setSaved(ids.has(id));
    });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  const handleToggleSaved = () => {
    if (!userId || !job) return;
    const next = !saved;
    setSaved(next);
    setJobSaved(userId, job.id, next).catch((err) => {
      console.warn('Failed to toggle saved job:', getErrorMessage(err, 'unknown error'));
      setSaved(!next);
    });
  };

  const handleApply = async () => {
    if (!userId || !job) return;
    setApplying(true);
    setApplyError(null);

    const teamMembers = applyAsTeam
      ? teamMembersInput
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_post_id: job.id,
        worker_id: userId,
        team_size: applyAsTeam ? teamMembers.length + 1 : 1,
        team_members: teamMembers,
      })
      .select()
      .single();

    setApplying(false);

    if (error) {
      setApplyError(error.message);
      return;
    }
    setMyApplication(data);
  };

  const handleMessageEmployer = async () => {
    if (!userId || !job) return;
    setMessaging(true);
    setMessageError(null);
    try {
      const conversationId = await getOrCreateConversation(userId, job.employer_id);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err) {
      const message = getErrorMessage(err, 'Mesaj başlatılamadı.');
      console.warn('Failed to start conversation:', message);
      setMessageError(message);
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Theme.background }]}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.centered, { backgroundColor: Theme.background }]}>
        <Text style={styles.notFoundText}>İlan bulunamadı.</Text>
      </View>
    );
  }

  const jobStatusInfo = JOB_POST_STATUS[job.status];
  const isWorker = profile?.role === 'worker';
  const isOwnJob = job.employer_id === userId;
  const showApplyBar = isWorker && !isOwnJob;

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scrollContent, showApplyBar && styles.scrollContentWithBar]}>
          <View style={styles.heroWrap}>
            <View style={styles.heroImageWrap}>
              {job.cover_photo_url ? (
                <Image
                  source={{ uri: job.cover_photo_url }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={250}
                  cachePolicy="disk"
                  recyclingKey={job.id}
                  priority="high"
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name="image-outline" size={48} color={Theme.mutedForeground} />
                </View>
              )}
              <View style={styles.heroTopRow}>
                <Pressable style={styles.roundButton} onPress={() => router.back()} hitSlop={8}>
                  <Ionicons name="arrow-back" size={20} color={Theme.foreground} />
                </Pressable>
                <View style={styles.heroTopRowRight}>
                  <Pressable style={styles.roundButton} onPress={() => shareJobToWhatsApp(job)} hitSlop={8}>
                    <Ionicons name="share-social-outline" size={20} color={Theme.foreground} />
                  </Pressable>
                  <Pressable style={styles.roundButton} onPress={handleToggleSaved} hitSlop={8}>
                    <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={Theme.foreground} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.badgeRow}>
                {job.is_urgent && <Pill label="Acil" tone="destructive" />}
                {job.status !== 'open' && <Pill label={jobStatusInfo.label} tone="muted" />}
                <Pill label={job.duration_type === 'daily' ? 'Günlük' : 'Sezonluk'} tone="primary" />
              </View>

              <Text style={styles.title}>{job.title}</Text>
              {employer?.business_name && <Text style={styles.businessName}>{employer.business_name}</Text>}

              {(job.district ?? employer?.location) && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={Theme.primary} />
                  <Text style={styles.locationText}>{job.district ?? employer?.location}</Text>
                </View>
              )}

              <View style={styles.infoGrid}>
                <InfoTile label="Ücret" value={`${job.daily_wage} ₺ / gün`} />
                <InfoTile label="Tarih" value={job.date} />
                <InfoTile label="Pozisyon" value={job.position ?? '-'} />
                <InfoTile label="Aranan Kişi" value={String(job.needed_worker_count)} />
              </View>

              {!!job.required_languages?.length && (
                <View style={styles.languageRow}>
                  <Ionicons name="language-outline" size={16} color={Theme.primary} />
                  <Text style={styles.locationText}>{job.required_languages.join(', ')}</Text>
                </View>
              )}

              {job.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>İş Tanımı</Text>
                  <Text style={styles.description}>{job.description}</Text>
                </View>
              )}

              {showApplyBar && (
                <View style={styles.actionsSection}>
                  {myApplication ? (
                    <View style={styles.appliedBanner}>
                      <Ionicons
                        name={myApplication.status === 'accepted' ? 'checkmark-circle' : 'time-outline'}
                        size={20}
                        color={Theme.primary}
                      />
                      <Text style={styles.appliedBannerText}>
                        Başvurun {APPLICATION_STATUS[myApplication.status].label.toLowerCase()}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.teamToggleRow}>
                        <Text style={styles.teamToggleLabel}>Ekip olarak başvur</Text>
                        <Switch value={applyAsTeam} onValueChange={setApplyAsTeam} trackColor={{ true: Theme.primary }} />
                      </View>
                      {applyAsTeam && (
                        <TextInput
                          style={styles.teamInput}
                          placeholder="Ekip arkadaşlarının adları (virgülle ayır)"
                          placeholderTextColor={Theme.mutedForeground}
                          value={teamMembersInput}
                          onChangeText={setTeamMembersInput}
                        />
                      )}
                    </>
                  )}
                  {applyError && <Text style={styles.errorText}>{applyError}</Text>}

                  <Pressable
                    style={[styles.messageButton, messaging && styles.disabled]}
                    disabled={messaging}
                    onPress={handleMessageEmployer}>
                    {messaging ? (
                      <ActivityIndicator color={Theme.primary} />
                    ) : (
                      <>
                        <Ionicons name="chatbubble-outline" size={18} color={Theme.primary} />
                        <Text style={styles.messageButtonText}>İşverene Mesaj Gönder</Text>
                      </>
                    )}
                  </Pressable>
                  {messageError && <Text style={styles.errorText}>{messageError}</Text>}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {showApplyBar && !myApplication && (
          <View style={styles.bottomBar}>
            <Pressable
              style={[styles.applyButton, (applying || job.status !== 'open') && styles.disabled]}
              disabled={applying || job.status !== 'open'}
              onPress={handleApply}>
              {applying ? (
                <ActivityIndicator color={Theme.accentForeground} />
              ) : (
                <>
                  <Text style={styles.applyButtonText}>{job.status === 'open' ? 'Hemen Başvur' : 'İlan Kapalı'}</Text>
                  {job.status === 'open' && <Ionicons name="arrow-forward" size={18} color={Theme.accentForeground} />}
                </>
              )}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Theme.foreground, fontSize: 16 },
  scrollContent: { paddingBottom: Spacing.five },
  scrollContentWithBar: { paddingBottom: 110 },
  heroWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  heroImageWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Theme.muted,
  },
  heroImage: { width: '100%', height: HERO_IMAGE_HEIGHT },
  heroPlaceholder: { width: '100%', height: HERO_IMAGE_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  heroTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  heroTopRowRight: { flexDirection: 'row', gap: 8 },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  detailCard: {
    marginTop: -64,
    backgroundColor: Theme.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    shadowColor: '#2C1810',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  title: {
    marginTop: 12,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Theme.primary,
    paddingRight: 12,
  },
  businessName: { marginTop: 8, fontSize: 14, fontWeight: '600', color: Theme.mutedForeground },
  locationRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 14, color: Theme.mutedForeground },
  infoGrid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoTile: {
    width: '47%',
    backgroundColor: Theme.input,
    borderRadius: 16,
    padding: 16,
  },
  infoTileLabel: { fontSize: 12, fontWeight: '500', color: Theme.mutedForeground },
  infoTileValue: { marginTop: 8, fontSize: 14, fontWeight: '800', color: Theme.foreground, lineHeight: 20 },
  languageRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Theme.primary },
  description: { marginTop: 12, fontSize: 15, lineHeight: 24, color: Theme.mutedForeground },
  actionsSection: { marginTop: 28, gap: 10 },
  teamToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamToggleLabel: { fontSize: 14, fontWeight: '700', color: Theme.foreground },
  teamInput: {
    backgroundColor: Theme.input,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Theme.foreground,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.secondary,
    borderRadius: 16,
    padding: 16,
  },
  appliedBannerText: { color: Theme.primary, fontWeight: '700' },
  errorText: { color: Theme.destructive, fontSize: 13, textAlign: 'center' },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.secondary,
    borderRadius: 999,
    paddingVertical: 14,
  },
  messageButtonText: { color: Theme.primary, fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(245, 241, 232, 0.92)',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 999,
    backgroundColor: Theme.accent,
    shadowColor: Theme.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  applyButtonText: { color: Theme.accentForeground, fontWeight: '800', fontSize: 16 },
});
