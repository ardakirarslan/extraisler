import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getOrCreateConversation } from '@/lib/conversations';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { SERVICE_OFFER_STATUS } from '@/lib/status-labels';
import { useAuth } from '@/providers/auth-provider';
import type { MasterProfile, PublicUserInfo, ServiceOffer, ServiceRequest } from '@/types/database';

type OfferRow = ServiceOffer & { master: PublicUserInfo | null; masterProfile: MasterProfile | null };

async function loadOffers(requestId: string): Promise<OfferRow[]> {
  const { data: offers, error } = await supabase.from('service_offers').select('*').eq('request_id', requestId);

  if (error || !offers) {
    console.warn('Failed to load offers:', error?.message);
    return [];
  }

  const masterIds = [...new Set(offers.map((o) => o.master_id))];
  const [{ data: masters }, { data: masterProfiles }] = masterIds.length
    ? await Promise.all([
        supabase.from('public_user_info').select('*').in('id', masterIds),
        supabase.from('master_profiles').select('*').in('user_id', masterIds),
      ])
    : [{ data: [] as PublicUserInfo[] }, { data: [] as MasterProfile[] }];

  const masterById = new Map((masters ?? []).map((m) => [m.id, m]));
  const masterProfileById = new Map((masterProfiles ?? []).map((m) => [m.user_id, m]));

  return offers.map((o) => ({
    ...o,
    master: masterById.get(o.master_id) ?? null,
    masterProfile: masterProfileById.get(o.master_id) ?? null,
  }));
}

export default function ServiceRequestOffersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decideError, setDecideError] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: requestData, error }, offerRows] = await Promise.all([
        supabase.from('service_requests').select('*').eq('id', id).single(),
        loadOffers(id),
      ]);

      if (cancelled) return;
      if (error || !requestData) {
        console.warn('Failed to load service request:', error?.message);
        setLoading(false);
        return;
      }
      setRequest(requestData);
      setOffers(offerRows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAccept = async (offerId: string) => {
    setDecidingId(offerId);
    setDecideError(null);
    // Trigger otomatik olarak diğer teklifleri reddeder ve talebi in_progress yapar.
    const { error } = await supabase.from('service_offers').update({ status: 'accepted' }).eq('id', offerId);
    setDecidingId(null);

    if (error) {
      setDecideError(getErrorMessage(error, 'Teklif kabul edilemedi.'));
      return;
    }

    const refreshed = await loadOffers(id);
    setOffers(refreshed);
    setRequest((prev) => (prev ? { ...prev, status: 'in_progress' } : prev));
  };

  const handleMessage = async (masterId: string) => {
    if (!userId) return;
    setMessagingId(masterId);
    try {
      const conversationId = await getOrCreateConversation(userId, masterId);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err) {
      console.warn('Failed to start conversation:', getErrorMessage(err, 'Mesaj başlatılamadı.'));
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

  if (!request) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="default">Talep bulunamadı.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.headerRow}>
            <ThemedText type="title" style={styles.headerTitle}>
              Gelen Teklifler
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {offers.length}
            </ThemedText>
          </ThemedView>

          {decideError && (
            <ThemedText type="small" style={styles.errorText}>
              {decideError}
            </ThemedText>
          )}

          {offers.length === 0 && (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="hammer-outline" size={32} color="#9AA0AC" />
              <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                Henüz teklif gelmedi.
              </ThemedText>
            </ThemedView>
          )}

          {offers.map((offer) => {
            const statusInfo = SERVICE_OFFER_STATUS[offer.status];
            const canAccept = request.status === 'open' && offer.status === 'pending';
            return (
              <ThemedView key={offer.id} style={styles.offerCard}>
                <ThemedView style={styles.offerHeaderRow}>
                  <ThemedView style={styles.avatar}>
                    <ThemedText type="smallBold" style={styles.avatarText}>
                      {(offer.master?.name ?? '?').slice(0, 1).toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.offerTextBlock}>
                    <ThemedText type="default" style={styles.masterName}>
                      {offer.master?.name ?? 'Usta'}
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.offerPrice}>
                      {offer.offered_price} ₺
                    </ThemedText>
                  </ThemedView>
                  <Badge label={statusInfo.label} tone={statusInfo.tone} />
                </ThemedView>

                {offer.masterProfile?.skills && offer.masterProfile.skills.length > 0 && (
                  <ThemedView style={styles.skillsRow}>
                    {offer.masterProfile.skills.map((skill) => (
                      <Badge key={skill} label={skill} tone="gray" />
                    ))}
                  </ThemedView>
                )}

                {offer.message && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {offer.message}
                  </ThemedText>
                )}

                <Pressable
                  style={[styles.actionButton, styles.messageButton]}
                  disabled={messagingId === offer.master_id}
                  onPress={() => handleMessage(offer.master_id)}>
                  {messagingId === offer.master_id ? (
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

                {canAccept && (
                  <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    disabled={decidingId === offer.id}
                    onPress={() => handleAccept(offer.id)}>
                    {decidingId === offer.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                        <ThemedText type="smallBold" style={styles.acceptButtonText}>
                          Kabul Et
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: { fontSize: 24, lineHeight: 28 },
  errorText: { color: '#D92D20', textAlign: 'center' },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.five },
  empty: { textAlign: 'center' },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  offerHeaderRow: {
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
  offerTextBlock: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  masterName: { fontWeight: '700' },
  offerPrice: { color: AccentColor },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'transparent' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.button,
  },
  messageButton: { backgroundColor: 'rgba(27, 67, 50, 0.1)' },
  messageButtonText: { color: AccentColor },
  acceptButton: { backgroundColor: AccentColor },
  acceptButtonText: { color: '#ffffff' },
});
