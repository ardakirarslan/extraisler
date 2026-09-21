import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, AccentTint, CardShadow, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { EmployerProfile, WorkerProfile } from '@/types/database';

const ROLE_LABELS: Record<string, string> = {
  worker: 'İşçi',
  employer: 'İşveren',
};

const APP_VERSION = '1.0.0';

type SettingsItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  iconBg: string;
  label: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
};

function goComingSoon(title: string, icon: keyof typeof Ionicons.glyphMap) {
  router.push({ pathname: '/coming-soon', params: { title, icon } });
}

function computeCompletion(role: string | null | undefined, worker: WorkerProfile | null, employer: EmployerProfile | null): number {
  if (role === 'employer') {
    const fields = [employer?.business_name, employer?.location, employer?.description];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }
  const fields: unknown[] = [worker?.skills?.length ? true : null, worker?.bio, worker?.district, worker?.languages?.length ? true : null, worker?.availability_status];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
  const isEmployer = profile?.role === 'employer';
  const userId = session?.user.id;

  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);

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

  const displayName = profile?.name || session?.user.email || 'Kullanıcı';
  const hasProfileDetails = isEmployer ? !!employerProfile : !!workerProfile;
  const completion = computeCompletion(profile?.role, workerProfile, employerProfile);

  const accountItems: SettingsItem[] = [
    {
      key: 'profile-info',
      icon: 'person-outline',
      iconTint: AccentColor,
      iconBg: AccentTint,
      label: 'Profil Bilgileri',
      subtitle: 'CV, deneyim ve iletişim detayları',
      onPress: () => router.push('/my-profile'),
    },
    {
      key: 'password',
      icon: 'lock-closed-outline',
      iconTint: AccentColor,
      iconBg: AccentTint,
      label: 'Şifre Değiştirme',
      subtitle: 'Güvenlik ve giriş ayarları',
      onPress: () => router.push('/change-password'),
    },
  ];

  const communityItems: SettingsItem[] = [
    {
      key: 'invite',
      icon: 'gift-outline',
      iconTint: '#B54708',
      iconBg: '#FEF0C7',
      label: 'Arkadaşlarını Davet Et',
      subtitle: 'Arkadaşın iş bulsun, sen kazan',
      badge: 'Kazan',
      onPress: () => goComingSoon('Arkadaşlarını Davet Et', 'gift-outline'),
    },
    {
      key: 'rate',
      icon: 'star-outline',
      iconTint: '#B54708',
      iconBg: '#FEF0C7',
      label: 'Uygulamayı Değerlendir',
      subtitle: "App Store ve Play Store'da oyla",
      onPress: () => goComingSoon('Uygulamayı Değerlendir', 'star-outline'),
    },
    {
      key: 'support',
      icon: 'chatbubbles-outline',
      iconTint: AccentColor,
      iconBg: AccentTint,
      label: 'Destek Merkezi',
      subtitle: 'SSS, canlı yardım ve iletişim',
      onPress: () => router.push('/support-center'),
    },
  ];

  const renderGroup = (title: string, items: SettingsItem[]) => (
    <ThemedView style={styles.group}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.groupTitle}>
        {title}
      </ThemedText>
      <ThemedView style={styles.card}>
        {items.map((item, index) => (
          <ThemedView key={item.key}>
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={item.onPress}>
              <ThemedView style={styles.rowLeft}>
                <ThemedView style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={19} color={item.iconTint} />
                </ThemedView>
                <ThemedView style={styles.rowTextBlock}>
                  <ThemedView style={styles.rowTitleRow}>
                    <ThemedText type="smallBold" style={styles.rowTitle}>
                      {item.label}
                    </ThemedText>
                    {item.badge && (
                      <ThemedView style={styles.badgePill}>
                        <ThemedText type="small" style={styles.badgePillText}>
                          {item.badge}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.rowSubtitle}>
                    {item.subtitle}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Ionicons name="chevron-forward" size={16} color="#C0C4CC" />
            </Pressable>
            {index < items.length - 1 && <ThemedView style={styles.divider} />}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.headerRow}>
            <ThemedView style={styles.headerTextBlock}>
              <ThemedText type="title" style={styles.headerTitle}>
                Ayarlar
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Hesap tercihlerinizi ve ayarlarınızı yönetin
              </ThemedText>
            </ThemedView>
            <Pressable style={styles.bellButton} onPress={() => goComingSoon('Bildirimler', 'notifications-outline')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={18} color="#12141A" />
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.profileCard}>
            <ThemedView style={styles.profileRow}>
              <ThemedView style={styles.avatarWrap}>
                <ThemedView style={styles.avatar}>
                  <ThemedText type="smallBold" style={styles.avatarText}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </ThemedText>
                </ThemedView>
                {hasProfileDetails && (
                  <ThemedView style={styles.verifiedDot}>
                    <Ionicons name="checkmark" size={9} color="#ffffff" />
                  </ThemedView>
                )}
              </ThemedView>
              <ThemedView style={styles.profileTextBlock}>
                <ThemedView style={styles.profileNameRow}>
                  <ThemedText type="smallBold" style={styles.profileName} numberOfLines={1}>
                    {displayName}
                  </ThemedText>
                  {profile?.role && (
                    <ThemedView style={styles.rolePill}>
                      <ThemedText type="small" style={styles.rolePillText}>
                        {ROLE_LABELS[profile.role]}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
                {session?.user.email && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {session.user.email}
                  </ThemedText>
                )}
              </ThemedView>
              <Pressable style={styles.editButton} onPress={() => router.push('/edit-profile')} hitSlop={8}>
                <Ionicons name="create-outline" size={16} color="#12141A" />
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.completionRow}>
              <ThemedView style={styles.completionLabelRow}>
                <Ionicons name="sparkles" size={14} color={AccentColor} />
                <ThemedText type="small" themeColor="textSecondary">
                  Profil Doluluk Oranı
                </ThemedText>
              </ThemedView>
              <ThemedText type="smallBold" style={styles.completionValue}>
                %{completion}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.progressTrack}>
              <ThemedView style={[styles.progressFill, { width: `${completion}%` }]} />
            </ThemedView>
          </ThemedView>

          {renderGroup('Hesap & Güvenlik', accountItems)}
          {renderGroup('Topluluk & Destek', communityItems)}

          <ThemedView style={styles.footer}>
            <Pressable style={({ pressed }) => [styles.signOutButton, pressed && styles.rowPressed]} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={16} color="#B95045" />
              <ThemedText type="smallBold" style={styles.signOutText}>
                Çıkış Yap
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary" style={styles.versionText}>
              Versiyon {APP_VERSION}
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'transparent' },
  headerTextBlock: { gap: 2, backgroundColor: 'transparent' },
  headerTitle: { fontSize: 26, lineHeight: 30 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...CardShadow,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    ...CardShadow,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: 'transparent' },
  avatarWrap: { backgroundColor: 'transparent' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AccentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AccentColor, fontSize: 20 },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#12B76A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
  profileName: { flexShrink: 1 },
  rolePill: { backgroundColor: AccentTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  rolePillText: { color: AccentColor, fontWeight: '700', fontSize: 10 },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0EBE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionRow: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2D8CB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  completionValue: { color: AccentColor },
  progressTrack: { marginTop: 8, height: 6, borderRadius: 3, backgroundColor: '#F0EBE2', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: AccentColor },
  group: { gap: Spacing.two, backgroundColor: 'transparent' },
  groupTitle: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', paddingHorizontal: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.card, ...CardShadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three },
  rowPressed: { opacity: 0.7 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1, backgroundColor: 'transparent' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTextBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
  rowTitle: {},
  rowSubtitle: {},
  badgePill: { backgroundColor: '#FEF0C7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgePillText: { color: '#B54708', fontWeight: '700', fontSize: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2D8CB', marginLeft: Spacing.three + 40 + Spacing.three },
  footer: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.one },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
  },
  signOutText: { color: '#B95045' },
  versionText: { fontSize: 11 },
});
