import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, CardShadow, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { uploadImageAsync } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { ServiceRequest } from '@/types/database';

const SERVICE_PHOTOS_BUCKET = 'service-photos';

function PhotoPicker({
  label,
  uri,
  onPick,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
}) {
  return (
    <ThemedView style={styles.photoField}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Pressable style={styles.photoPicker} onPress={onPick}>
        {uri ? (
          <Image source={{ uri }} style={styles.photoPreview} />
        ) : (
          <ThemedView style={styles.photoPickerEmpty}>
            <Ionicons name="camera-outline" size={24} color="#6B7280" />
            <ThemedText type="small" themeColor="textSecondary">
              Fotoğraf Seç
            </ThemedText>
          </ThemedView>
        )}
      </Pressable>
    </ThemedView>
  );
}

export default function CompleteServiceRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError || !data) {
          console.warn('Failed to load service request:', fetchError?.message);
        } else {
          setRequest(data);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pickPhoto = async (onPicked: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Fotoğraf seçmek için galeri izni gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onPicked(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setError(null);
    if (!userId || !request) return;

    if (!beforeUri || !afterUri) {
      setError('Öncesi ve sonrası fotoğraflarının ikisi de zorunlu.');
      return;
    }

    setSubmitting(true);
    try {
      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImageAsync(SERVICE_PHOTOS_BUCKET, beforeUri, `${request.id}/before`),
        uploadImageAsync(SERVICE_PHOTOS_BUCKET, afterUri, `${request.id}/after`),
      ]);

      const { error: photosError } = await supabase.from('service_photos').insert([
        { request_id: request.id, photo_url: beforeUrl, type: 'before', uploaded_by: userId },
        { request_id: request.id, photo_url: afterUrl, type: 'after', uploaded_by: userId },
      ]);
      if (photosError) throw photosError;

      const { error: statusError } = await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', request.id);
      if (statusError) throw statusError;

      router.dismissTo({ pathname: '/service-requests/[id]', params: { id: request.id } });
    } catch (err) {
      setError(getErrorMessage(err, 'İş tamamlanamadı.'));
    } finally {
      setSubmitting(false);
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
          <ThemedText type="title" style={styles.title}>
            İşi Tamamla
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            İşi tamamlandı olarak işaretlemeden önce öncesi ve sonrası fotoğraflarını yükle.
          </ThemedText>

          <PhotoPicker label="Öncesi Fotoğrafı" uri={beforeUri} onPick={() => pickPhoto(setBeforeUri)} />
          <PhotoPicker label="Sonrası Fotoğrafı" uri={afterUri} onPick={() => pickPhoto(setAfterUri)} />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            disabled={submitting}
            onPress={handleComplete}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={18} color="#ffffff" />
                <ThemedText type="default" style={styles.primaryButtonText}>
                  İşi Tamamla
                </ThemedText>
              </>
            )}
          </Pressable>
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
  title: { fontSize: 24, lineHeight: 28 },
  photoField: { gap: Spacing.one },
  photoPicker: {
    height: 180,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#E3E5EC',
    backgroundColor: '#F2F3F7',
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  errorText: { color: '#D92D20', fontSize: 13, textAlign: 'center' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AccentColor,
    borderRadius: Radius.button,
    paddingVertical: 15,
    marginTop: Spacing.one,
    ...CardShadow,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressed: { opacity: 0.85 },
});
