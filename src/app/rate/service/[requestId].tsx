import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/star-rating';
import { Colors } from '@/constants/auth-theme';
import { Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { RaterRole } from '@/types/database';

export default function RateServiceRequestScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [ratedUserId, setRatedUserId] = useState<string | null>(null);
  const [raterRole, setRaterRole] = useState<RaterRole | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: request, error: requestError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        if (!cancelled) {
          setBlockedReason('Talep bulunamadı.');
          setLoading(false);
        }
        return;
      }

      if (request.status !== 'completed') {
        if (!cancelled) {
          setBlockedReason('Bu talep henüz tamamlanmadı.');
          setLoading(false);
        }
        return;
      }

      const { data: acceptedOffer } = await supabase
        .from('service_offers')
        .select('master_id')
        .eq('request_id', requestId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!acceptedOffer) {
        if (!cancelled) {
          setBlockedReason('Bu talep için kabul edilmiş bir teklif bulunamadı.');
          setLoading(false);
        }
        return;
      }

      let target: string | null = null;
      let role: RaterRole | null = null;
      if (userId === request.requester_id) {
        target = acceptedOffer.master_id;
        role = 'requester';
      } else if (userId === acceptedOffer.master_id) {
        target = request.requester_id;
        role = 'master';
      }

      if (!target || !role) {
        if (!cancelled) {
          setBlockedReason('Bu talebi değerlendirme yetkin yok.');
          setLoading(false);
        }
        return;
      }

      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('service_request_id', requestId)
        .eq('rater_id', userId)
        .maybeSingle();

      if (existing) {
        if (!cancelled) {
          setBlockedReason('Bu talebi zaten değerlendirdin.');
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setRatedUserId(target);
        setRaterRole(role);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId, userId]);

  const handleSubmit = async () => {
    if (!userId || !ratedUserId || !raterRole) return;
    setError(null);
    setSubmitting(true);
    const { error: insertError } = await supabase.from('ratings').insert({
      service_request_id: requestId,
      rater_id: userId,
      rated_id: ratedUserId,
      rater_role: raterRole,
      score,
      comment: comment.trim() || null,
    });
    setSubmitting(false);

    if (insertError) {
      setError(getErrorMessage(insertError, 'Değerlendirme gönderilemedi.'));
      return;
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (blockedReason) {
    return (
      <View style={[styles.flex, styles.centered, styles.content]}>
        <Text style={styles.blockedText}>{blockedReason}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.content}>
        <Text style={styles.title}>Değerlendir</Text>
        <Text style={styles.subtitle}>Bu iş nasıl geçti? Puan ver ve istersen kısa bir yorum bırak.</Text>

        <StarRating score={score} onChange={setScore} />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Yorumun (opsiyonel)"
          placeholderTextColor={Colors.textPlaceholder}
          value={comment}
          onChangeText={setComment}
          multiline
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Gönder</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.pageBackground },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  blockedText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  error: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressedOpacity: { opacity: 0.8 },
});
