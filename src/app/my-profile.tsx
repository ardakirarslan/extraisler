import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobDetailTheme as Theme } from '@/constants/job-detail-theme';
import { Spacing } from '@/constants/theme';
import { deleteWorkerDocument, loadWorkerDocuments, pickPdfDocument, uploadWorkerDocument } from '@/lib/documents';
import { getErrorMessage } from '@/lib/errors';
import { loadRatingSummary, type RatingSummary } from '@/lib/ratings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { EmployerProfile, MasterProfile, WorkerDocument, WorkerProfile } from '@/types/database';

const ROLE_LABELS: Record<string, string> = {
  worker: 'İşçi',
  employer: 'İşveren',
};

type Stats = { primary: number; secondary: number; tertiary: number };

async function loadStats(userId: string, isEmployer: boolean): Promise<Stats> {
  if (isEmployer) {
    const { data: myJobs } = await supabase.from('job_posts').select('id, status').eq('employer_id', userId);
    const jobIds = (myJobs ?? []).map((j) => j.id);
    const openCount = (myJobs ?? []).filter((j) => j.status === 'open').length;

    let totalApps = 0;
    let completedApps = 0;
    if (jobIds.length) {
      const { count: totalCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('job_post_id', jobIds);
      const { count: compCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('job_post_id', jobIds)
        .eq('status', 'completed');
      totalApps = totalCount ?? 0;
      completedApps = compCount ?? 0;
    }
    return { primary: openCount, secondary: totalApps, tertiary: completedApps };
  }

  const [{ count: completedCount }, { count: activeCount }, { count: acceptedCount }, { count: rejectedCount }] =
    await Promise.all([
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('worker_id', userId).eq('status', 'completed'),
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', userId)
        .in('status', ['pending', 'accepted']),
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', userId)
        .in('status', ['accepted', 'completed']),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('worker_id', userId).eq('status', 'rejected'),
    ]);

  const decided = (acceptedCount ?? 0) + (rejectedCount ?? 0);
  const rate = decided > 0 ? Math.round(((acceptedCount ?? 0) / decided) * 100) : 0;
  return { primary: completedCount ?? 0, secondary: activeCount ?? 0, tertiary: rate };
}

export default function MyProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const isEmployer = profile?.role === 'employer';
  const userId = session?.user.id;

  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ average: 0, count: 0 });
  const [stats, setStats] = useState<Stats>({ primary: 0, secondary: 0, tertiary: 0 });
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !profile?.role) return;
    let cancelled = false;
    const table = isEmployer ? 'employer_profiles' : 'worker_profiles';

    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (isEmployer) setEmployerProfile(data as EmployerProfile | null);
        else setWorkerProfile(data as WorkerProfile | null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, profile?.role, isEmployer]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('master_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMasterProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadRatingSummary(userId).then((summary) => {
      if (!cancelled) setRatingSummary(summary);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !profile?.role) return;
    let cancelled = false;
    loadStats(userId, isEmployer).then((result) => {
      if (!cancelled) setStats(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, profile?.role, isEmployer]);

  const showDocuments = !isEmployer || !!masterProfile;

  useEffect(() => {
    if (!userId || !showDocuments) return;
    let cancelled = false;
    loadWorkerDocuments(userId).then((rows) => {
      if (!cancelled) setDocuments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, showDocuments]);

  const handleAddDocument = async () => {
    if (!userId) return;
    setDocError(null);
    const asset = await pickPdfDocument();
    if (!asset) return;
    setUploadingDoc(true);
    try {
      const doc = await uploadWorkerDocument(userId, asset);
      setDocuments((prev) => [doc, ...prev]);
    } catch (err) {
      setDocError(getErrorMessage(err, 'Belge yüklenemedi.'));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (doc: WorkerDocument) => {
    try {
      await deleteWorkerDocument(doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setDocError(getErrorMessage(err, 'Belge silinemedi.'));
    }
  };

  const displayName = profile?.name || session?.user.email || 'Kullanıcı';
  const location = isEmployer ? employerProfile?.location : workerProfile?.district;
  const hasCompletedProfile = isEmployer ? !!employerProfile : !!workerProfile;

  const statLabels = isEmployer
    ? [
        { label: 'Açık İlan', value: String(stats.primary) },
        { label: 'Toplam Başvuru', value: String(stats.secondary) },
        { label: 'Tamamlanan İş', value: String(stats.tertiary) },
      ]
    : [
        { label: 'Tamamlanan', value: `${stats.primary} İş` },
        { label: 'Aktif Başvuru', value: `${stats.secondary} İlan` },
        { label: 'Kabul Oranı', value: `%${stats.tertiary}` },
      ];

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.banner}>
            <Pressable style={styles.bannerButton} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>
            <Text style={styles.bannerLabel}>Kullanıcı Profili</Text>
            <Pressable style={styles.bannerButton} onPress={() => router.push('/edit-profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={20} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
                </View>
                {hasCompletedProfile && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  </View>
                )}
              </View>
              <View style={styles.rolePill}>
                <View style={styles.rolePillDot} />
                <Text style={styles.rolePillText}>{profile?.role ? ROLE_LABELS[profile.role] : 'Kullanıcı'}</Text>
              </View>
            </View>

            <Text style={styles.name}>{displayName}</Text>
            {isEmployer && employerProfile?.business_name && <Text style={styles.subtitle}>{employerProfile.business_name}</Text>}
            {!isEmployer && workerProfile?.skills?.[0] && <Text style={styles.subtitle}>{workerProfile.skills[0]}</Text>}

            <View style={styles.metaRow}>
              {!!location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={14} color={Theme.primary} />
                  <Text style={styles.metaText}>{location}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={Theme.accent} />
                <Text style={styles.metaText}>
                  {ratingSummary.count > 0 ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} Değerlendirme)` : 'Henüz değerlendirme yok'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {statLabels.map((s) => (
                <View key={s.label} style={styles.statTile}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {!isEmployer && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Yetenekler & Uzmanlık</Text>
                <Pressable onPress={() => router.push('/edit-profile')} hitSlop={8}>
                  <Text style={styles.editLink}>Düzenle</Text>
                </Pressable>
              </View>
              <View style={styles.chipsRow}>
                {(workerProfile?.skills ?? []).map((skill) => (
                  <View key={skill} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                  </View>
                ))}
                {(workerProfile?.skills ?? []).length === 0 && <Text style={styles.emptyHint}>Henüz yetenek eklenmedi.</Text>}
              </View>
            </View>
          )}

          {isEmployer && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>İşletme Bilgileri</Text>
                <Pressable onPress={() => router.push('/edit-profile')} hitSlop={8}>
                  <Text style={styles.editLink}>Düzenle</Text>
                </Pressable>
              </View>
              {employerProfile?.description ? (
                <Text style={styles.bodyText}>{employerProfile.description}</Text>
              ) : (
                <Text style={styles.emptyHint}>Henüz açıklama eklenmedi.</Text>
              )}
            </View>
          )}

          {masterProfile && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Usta Profili</Text>
                <Link href="/master-setup" asChild>
                  <Pressable hitSlop={8}>
                    <Text style={styles.editLink}>Düzenle</Text>
                  </Pressable>
                </Link>
              </View>
              <View style={styles.chipsRow}>
                {(masterProfile.skills ?? []).map((skill) => (
                  <View key={skill} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                  </View>
                ))}
              </View>
              {masterProfile.bio && <Text style={[styles.bodyText, styles.mt]}>{masterProfile.bio}</Text>}
            </View>
          )}

          {!masterProfile && (
            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.push('/master-setup')}>
              <Ionicons name="hammer-outline" size={18} color={Theme.primary} />
              <Text style={styles.secondaryButtonText}>Usta Ol</Text>
            </Pressable>
          )}

          {showDocuments && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Özgeçmiş & Belgeler</Text>
                <Text style={styles.docCount}>{documents.length} Belge</Text>
              </View>

              {docError && <Text style={styles.errorText}>{docError}</Text>}

              <View style={styles.docList}>
                {documents.map((doc) => (
                  <View key={doc.id} style={styles.docRow}>
                    <View style={styles.docIconWrap}>
                      <Ionicons name="document-text-outline" size={22} color={Theme.primary} />
                    </View>
                    <View style={styles.docTextBlock}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.docMeta}>{doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : 'PDF'}</Text>
                    </View>
                    <Pressable style={styles.docActionButton} onPress={() => Linking.openURL(doc.file_url)} hitSlop={6}>
                      <Ionicons name="open-outline" size={16} color={Theme.primary} />
                    </Pressable>
                    <Pressable style={styles.docActionButton} onPress={() => handleDeleteDocument(doc)} hitSlop={6}>
                      <Ionicons name="trash-outline" size={16} color={Theme.destructive} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable style={({ pressed }) => [styles.addDocButton, pressed && styles.pressed]} disabled={uploadingDoc} onPress={handleAddDocument}>
                {uploadingDoc ? (
                  <ActivityIndicator color={Theme.primary} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color={Theme.primary} />
                    <Text style={styles.addDocButtonText}>Belge Ekle (PDF)</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          <View style={styles.navCard}>
            <Link href="/applications" asChild>
              <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
                <View style={styles.navRowLeft}>
                  <View style={styles.navIconWrap}>
                    <Ionicons name="paper-plane-outline" size={18} color={Theme.primary} />
                  </View>
                  <Text style={styles.navRowText}>{isEmployer ? 'İlanlarım' : 'Başvurduğum İlanlar'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.mutedForeground} />
              </Pressable>
            </Link>

            {isEmployer && (
              <>
                <View style={styles.navDivider} />
                <Link href="/favorites" asChild>
                  <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
                    <View style={styles.navRowLeft}>
                      <View style={styles.navIconWrap}>
                        <Ionicons name="star-outline" size={18} color={Theme.primary} />
                      </View>
                      <Text style={styles.navRowText}>Favori Personelim</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Theme.mutedForeground} />
                  </Pressable>
                </Link>
              </>
            )}

            {!isEmployer && (
              <>
                <View style={styles.navDivider} />
                <Link href="/saved-jobs" asChild>
                  <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
                    <View style={styles.navRowLeft}>
                      <View style={styles.navIconWrap}>
                        <Ionicons name="bookmark-outline" size={18} color={Theme.primary} />
                      </View>
                      <Text style={styles.navRowText}>Kaydedilen İlanlar</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Theme.mutedForeground} />
                  </Pressable>
                </Link>
              </>
            )}

            <View style={styles.navDivider} />
            <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.pressed]} onPress={() => signOut()}>
              <View style={styles.navRowLeft}>
                <View style={[styles.navIconWrap, styles.signOutIconWrap]}>
                  <Ionicons name="log-out-outline" size={18} color={Theme.destructive} />
                </View>
                <Text style={[styles.navRowText, styles.signOutText]}>Çıkış Yap</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  scrollContent: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  banner: {
    height: 96,
    borderRadius: 20,
    backgroundColor: Theme.primary,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bannerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  card: {
    marginTop: -48,
    backgroundColor: Theme.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#2C1810',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  avatarWrap: { marginTop: -40 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Theme.card,
    backgroundColor: '#E9E2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Theme.primary },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#12B76A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.card,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rolePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.primary },
  rolePillText: { fontSize: 11, fontWeight: '700', color: Theme.primary },
  name: { marginTop: 12, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: Theme.primary },
  subtitle: { marginTop: 2, fontSize: 13, fontWeight: '600', color: Theme.mutedForeground },
  metaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Theme.mutedForeground },
  statsGrid: { marginTop: 20, flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: Theme.input, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: Theme.mutedForeground, textAlign: 'center' },
  statValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: Theme.foreground },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Theme.primary },
  editLink: { fontSize: 12, fontWeight: '700', color: Theme.accent },
  chipsRow: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Theme.input, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: Theme.foreground },
  emptyHint: { fontSize: 13, color: Theme.mutedForeground },
  bodyText: { fontSize: 13, lineHeight: 20, color: Theme.mutedForeground },
  mt: { marginTop: 10 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.secondary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: { color: Theme.primary, fontWeight: '700', fontSize: 14 },
  pressed: { opacity: 0.85 },
  docCount: { fontSize: 12, fontWeight: '600', color: Theme.mutedForeground },
  docList: { marginTop: 14, gap: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Theme.input, borderRadius: 16, padding: 12 },
  docIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(27,67,50,0.1)', alignItems: 'center', justifyContent: 'center' },
  docTextBlock: { flex: 1, gap: 2 },
  docName: { fontSize: 13, fontWeight: '700', color: Theme.foreground },
  docMeta: { fontSize: 11, color: Theme.mutedForeground },
  docActionButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.card },
  errorText: { marginTop: 8, fontSize: 12, color: Theme.destructive },
  addDocButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Theme.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
  },
  addDocButtonText: { fontSize: 13, fontWeight: '700', color: Theme.primary },
  navCard: { backgroundColor: Theme.card, borderRadius: 20, padding: 6 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 14 },
  navRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.input, alignItems: 'center', justifyContent: 'center' },
  signOutIconWrap: { backgroundColor: 'rgba(185,80,69,0.12)' },
  navRowText: { fontSize: 14, fontWeight: '700', color: Theme.foreground },
  signOutText: { color: Theme.destructive },
  navDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Theme.border, marginHorizontal: 12 },
});
