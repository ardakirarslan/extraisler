import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { SERVICE_OFFER_STATUS, SERVICE_REQUEST_STATUS } from '@/lib/status-labels';
import { useAuth } from '@/providers/auth-provider';
import type { PublicUserInfo, ServiceOffer, ServicePhoto, ServiceRequest } from '@/types/database';

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <ThemedView style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#6B7280" style={styles.infoIcon} />
      <ThemedText type="default" themeColor="textSecondary" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [requester, setRequester] = useState<PublicUserInfo | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [isMaster, setIsMaster] = useState(false);
  const [myOffer, setMyOffer] = useState<ServiceOffer | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [photos, setPhotos] = useState<ServicePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: requestData, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !requestData) {
        console.warn('Failed to load service request:', error?.message);
        if (!cancelled) setLoading(false);
        return;
      }

      const isRequester = requestData.requester_id === userId;
      const isCompleted = requestData.status === 'completed';

      const [{ data: requesterData }, countResult, masterResult, myOfferResult, ratingResult, photosResult] =
        await Promise.all([
          supabase.from('public_user_info').select('*').eq('id', requestData.requester_id).maybeSingle(),
          isRequester
            ? supabase.from('service_offers').select('id', { count: 'exact', head: true }).eq('request_id', id)
            : Promise.resolve({ count: 0 }),
          userId && !isRequester
            ? supabase.from('master_profiles').select('user_id').eq('user_id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
          userId && !isRequester
            ? supabase.from('service_offers').select('*').eq('request_id', id).eq('master_id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
          userId && isCompleted
            ? supabase.from('ratings').select('id').eq('service_request_id', id).eq('rater_id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
          isCompleted
            ? supabase.from('service_photos').select('*').eq('request_id', id)
            : Promise.resolve({ data: [] as ServicePhoto[] }),
        ]);

      if (cancelled) return;
      setRequest(requestData);
      setRequester(requesterData);
      setOfferCount(countResult.count ?? 0);
      setIsMaster(!!masterResult.data);
      setMyOffer(myOfferResult.data);
      setHasRated(!!ratingResult.data);
      setPhotos(photosResult.data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  const handleSubmitOffer = async () => {
    if (!userId || !request) return;
    setOfferError(null);

    const parsedPrice = parseFloat(offerPrice.replace(',', '.'));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setOfferError('Geçerli bir fiyat girin.');
      return;
    }

    setSubmittingOffer(true);
    const { data, error } = await supabase
      .from('service_offers')
      .insert({
        request_id: request.id,
        master_id: userId,
        offered_price: parsedPrice,
        message: offerMessage.trim() || null,
      })
      .select()
      .single();
    setSubmittingOffer(false);

    if (error) {
      setOfferError(error.message);
      return;
    }
    setMyOffer(data);
  };

  const handleCancel = () => {
    if (!request) return;
    Alert.alert('Talebi İptal Et', 'Bu talebi iptal etmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          const { error } = await supabase.from('service_requests').update({ status: 'cancelled' }).eq('id', request.id);
          setCancelling(false);
          if (error) {
            console.warn('Failed to cancel request:', getErrorMessage(error, 'Talep iptal edilemedi.'));
            return;
          }
          setRequest((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
        },
      },
    ]);
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

  const statusInfo = SERVICE_REQUEST_STATUS[request.status];
  const isRequester = request.requester_id === userId;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.heroCard}>
            <ThemedView style={styles.heroHeaderRow}>
              <Badge label={statusInfo.label} tone={statusInfo.tone} />
              <Badge label={request.category} tone="blue" />
              {request.is_urgent && <Badge label="Acil" tone="red" />}
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              {request.title}
            </ThemedText>
            {requester?.name && (
              <ThemedText type="default" themeColor="textSecondary">
                Talep eden: {requester.name}
              </ThemedText>
            )}
            {request.price != null && (
              <ThemedView style={styles.priceRow}>
                <ThemedText type="title" style={styles.price}>
                  {request.price} ₺
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.detailsCard}>
            {request.location && <InfoRow icon="location-outline" label="Konum" value={request.location} />}
            {request.needed_date && (
              <InfoRow icon="calendar-outline" label="İhtiyaç tarihi" value={request.needed_date} />
            )}
          </ThemedView>

          {request.description && (
            <ThemedView style={styles.detailsCard}>
              <ThemedText type="smallBold">Açıklama</ThemedText>
              <ThemedText type="default" style={styles.description}>
                {request.description}
              </ThemedText>
            </ThemedView>
          )}

          {request.status === 'completed' && photos.length > 0 && (
            <ThemedView style={styles.detailsCard}>
              <ThemedText type="smallBold">Öncesi / Sonrası</ThemedText>
              {(['before', 'after'] as const).map((type) => {
                const typePhotos = photos.filter((p) => p.type === type);
                if (typePhotos.length === 0) return null;
                return (
                  <ThemedView key={type} style={styles.photoGroup}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {type === 'before' ? 'Öncesi' : 'Sonrası'}
                    </ThemedText>
                    <ThemedView style={styles.photoRow}>
                      {typePhotos.map((p) => (
                        <Image key={p.id} source={{ uri: p.photo_url }} style={styles.photoThumb} />
                      ))}
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}

          {isRequester ? (
            <ThemedView style={styles.actionsSection}>
              <Link href={{ pathname: '/service-requests/offers/[id]', params: { id: request.id } }} asChild>
                <Pressable style={({ pressed }) => [styles.offersCard, pressed && styles.pressed]}>
                  <Ionicons name="people-outline" size={20} color={AccentColor} />
                  <ThemedText type="smallBold" style={styles.offersCardText}>
                    {offerCount} teklif alındı
                  </ThemedText>
                  <ThemedView style={styles.spacer} />
                  <Ionicons name="chevron-forward" size={18} color="#C0C4CC" />
                </Pressable>
              </Link>

              {request.status === 'in_progress' && (
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({ pathname: '/service-requests/complete/[id]', params: { id: request.id } })
                  }>
                  <Ionicons name="checkmark-done-outline" size={18} color="#ffffff" />
                  <ThemedText type="default" style={styles.primaryButtonText}>
                    İşi Tamamla
                  </ThemedText>
                </Pressable>
              )}

              {request.status === 'completed' && !hasRated && (
                <Link href={{ pathname: '/rate/service/[requestId]', params: { requestId: request.id } }} asChild>
                  <Pressable style={({ pressed }) => [styles.rateButton, pressed && styles.pressed]}>
                    <Ionicons name="star-outline" size={18} color={AccentColor} />
                    <ThemedText type="default" style={styles.rateButtonText}>
                      Değerlendir
                    </ThemedText>
                  </Pressable>
                </Link>
              )}

              {(request.status === 'open' || request.status === 'in_progress') && (
                <Pressable
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                  disabled={cancelling}
                  onPress={handleCancel}>
                  {cancelling ? (
                    <ActivityIndicator color="#B42318" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={18} color="#B42318" />
                      <ThemedText type="default" style={styles.cancelButtonText}>
                        Talebi İptal Et
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              )}
            </ThemedView>
          ) : isMaster ? (
            <ThemedView style={styles.actionsSection}>
              {myOffer ? (
                <ThemedView style={styles.myOfferCard}>
                  <ThemedView style={styles.heroHeaderRow}>
                    <Badge label={SERVICE_OFFER_STATUS[myOffer.status].label} tone={SERVICE_OFFER_STATUS[myOffer.status].tone} />
                  </ThemedView>
                  <ThemedText type="smallBold">Teklifin: {myOffer.offered_price} ₺</ThemedText>
                  {myOffer.message && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {myOffer.message}
                    </ThemedText>
                  )}
                  {request.status === 'completed' && myOffer.status === 'accepted' && !hasRated && (
                    <Link href={{ pathname: '/rate/service/[requestId]', params: { requestId: request.id } }} asChild>
                      <Pressable style={({ pressed }) => [styles.rateButton, pressed && styles.pressed]}>
                        <Ionicons name="star-outline" size={18} color={AccentColor} />
                        <ThemedText type="default" style={styles.rateButtonText}>
                          Değerlendir
                        </ThemedText>
                      </Pressable>
                    </Link>
                  )}
                </ThemedView>
              ) : request.status === 'open' ? (
                <ThemedView style={styles.offerForm}>
                  <ThemedText type="smallBold">Teklif Ver</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="Fiyat teklifin (₺)"
                    placeholderTextColor="#9AA0AC"
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                  />
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder="Mesajın (opsiyonel)"
                    placeholderTextColor="#9AA0AC"
                    value={offerMessage}
                    onChangeText={setOfferMessage}
                    multiline
                  />
                  {offerError && <Text style={styles.errorText}>{offerError}</Text>}
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                    disabled={submittingOffer}
                    onPress={handleSubmitOffer}>
                    {submittingOffer ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <ThemedText type="default" style={styles.primaryButtonText}>
                        Teklif Gönder
                      </ThemedText>
                    )}
                  </Pressable>
                </ThemedView>
              ) : (
                <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                  Bu talep artık teklif almıyor.
                </ThemedText>
              )}
            </ThemedView>
          ) : (
            <ThemedView style={styles.actionsSection}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                Bu talebe teklif verebilmek için usta profili oluşturman gerekiyor.
              </ThemedText>
              <Link href="/master-setup" asChild>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Ionicons name="hammer-outline" size={18} color="#ffffff" />
                  <ThemedText type="default" style={styles.primaryButtonText}>
                    Usta Ol
                  </ThemedText>
                </Pressable>
              </Link>
            </ThemedView>
          )}
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
  heroHeaderRow: { flexDirection: 'row', gap: Spacing.one, backgroundColor: 'transparent' },
  title: { fontSize: 26, lineHeight: 30 },
  priceRow: { marginTop: Spacing.one, backgroundColor: 'transparent' },
  price: { fontSize: 24, lineHeight: 28, color: AccentColor },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  infoIcon: { width: 20 },
  infoLabel: { flex: 1 },
  description: { lineHeight: 22 },
  actionsSection: { gap: Spacing.two },
  pressed: { opacity: 0.85 },
  spacer: { flex: 1, backgroundColor: 'transparent' },
  offersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  offersCardText: { color: AccentColor },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AccentColor,
    borderRadius: Radius.button,
    paddingVertical: 15,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  myOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.one,
    ...CardShadow,
  },
  offerForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  input: {
    backgroundColor: '#F2F3F7',
    borderWidth: 1,
    borderColor: '#E3E5EC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#12141A',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: '#D92D20', fontSize: 13 },
  centeredText: { textAlign: 'center' },
  photoGroup: { gap: Spacing.one },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, backgroundColor: 'transparent' },
  photoThumb: { width: 96, height: 96, borderRadius: 12, backgroundColor: '#F2F3F7' },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF0C7',
    borderRadius: Radius.button,
    paddingVertical: 15,
  },
  rateButtonText: { color: AccentColor, fontWeight: '700', fontSize: 16 },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE4E2',
    borderRadius: Radius.button,
    paddingVertical: 15,
  },
  cancelButtonText: { color: '#B42318', fontWeight: '700', fontSize: 16 },
});
