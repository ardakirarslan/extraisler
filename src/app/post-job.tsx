import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { Colors } from '@/constants/auth-theme';
import { COMMON_LANGUAGES, MUGLA_DISTRICTS } from '@/constants/locations';
import { AccentColor, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { JobDurationType } from '@/types/database';

const COVER_PHOTO_BUCKET = 'job-covers';

/** Uploads a locally-picked image to Supabase Storage and returns its public URL. */
async function uploadCoverPhoto(uri: string, userId: string): Promise<string> {
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: path,
    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  } as unknown as Blob);

  const { error } = await supabase.storage.from(COVER_PHOTO_BUCKET).upload(path, formData, {
    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(COVER_PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function PostJobScreen() {
  const { session } = useAuth();

  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [neededWorkerCount, setNeededWorkerCount] = useState('1');
  const [dailyWage, setDailyWage] = useState('');
  const [durationType, setDurationType] = useState<JobDurationType>('daily');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [requiredLanguages, setRequiredLanguages] = useState<string[]>([]);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = (lang: string) => {
    setRequiredLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const handlePickCoverPhoto = async () => {
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
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const userId = session?.user.id;
    if (!userId) return;

    const parsedWorkerCount = parseInt(neededWorkerCount, 10);
    const parsedWage = parseFloat(dailyWage.replace(',', '.'));

    if (!title.trim()) {
      setError('Başlık gerekli.');
      return;
    }
    if (!Number.isFinite(parsedWorkerCount) || parsedWorkerCount < 1) {
      setError('Geçerli bir kişi sayısı girin.');
      return;
    }
    if (!Number.isFinite(parsedWage) || parsedWage <= 0) {
      setError('Geçerli bir ücret girin.');
      return;
    }

    setSubmitting(true);

    let coverPhotoUrl: string | null = null;
    if (coverPhotoUri) {
      try {
        coverPhotoUrl = await uploadCoverPhoto(coverPhotoUri, userId);
      } catch (uploadErr) {
        setSubmitting(false);
        setError(uploadErr instanceof Error ? `Fotoğraf yüklenemedi: ${uploadErr.message}` : 'Fotoğraf yüklenemedi.');
        return;
      }
    }

    const { error: insertError } = await supabase.from('job_posts').insert({
      employer_id: userId,
      title: title.trim(),
      position: position.trim() || null,
      date: date.toISOString().slice(0, 10),
      needed_worker_count: parsedWorkerCount,
      daily_wage: parsedWage,
      description: description.trim() || null,
      duration_type: durationType,
      is_urgent: isUrgent,
      district,
      required_languages: requiredLanguages,
      cover_photo_url: coverPhotoUrl,
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.dismissTo('/applications');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Kapak Fotoğrafı (opsiyonel)</Text>
            <Pressable style={styles.photoPicker} onPress={handlePickCoverPhoto}>
              {coverPhotoUri ? (
                <Image source={{ uri: coverPhotoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPickerEmpty}>
                  <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.photoPickerText}>Fotoğraf Seç</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. Garson aranıyor"
              placeholderTextColor={Colors.textPlaceholder}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pozisyon</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. Garson"
              placeholderTextColor={Colors.textPlaceholder}
              value={position}
              onChangeText={setPosition}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Süre Tipi</Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleButton, durationType === 'daily' && styles.roleButtonActive]}
                onPress={() => setDurationType('daily')}>
                <Text style={[styles.roleButtonText, durationType === 'daily' && styles.roleButtonTextActive]}>
                  Günlük
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleButton, durationType === 'seasonal' && styles.roleButtonActive]}
                onPress={() => setDurationType('seasonal')}>
                <Text style={[styles.roleButtonText, durationType === 'seasonal' && styles.roleButtonTextActive]}>
                  Sezonluk
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tarih</Text>
            <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: Colors.textPrimary }}>{date.toISOString().slice(0, 10)}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(_event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Aranan Kişi Sayısı</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={neededWorkerCount}
              onChangeText={setNeededWorkerCount}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Günlük Ücret (₺)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Örn. 1500"
              placeholderTextColor={Colors.textPlaceholder}
              value={dailyWage}
              onChangeText={setDailyWage}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>İlçe</Text>
            <View style={styles.chipsRow}>
              {MUGLA_DISTRICTS.map((d) => (
                <Chip key={d} label={d} active={district === d} onPress={() => setDistrict(district === d ? null : d)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Aranan Diller (opsiyonel)</Text>
            <View style={styles.chipsRow}>
              {COMMON_LANGUAGES.map((lang) => (
                <Chip key={lang} label={lang} active={requiredLanguages.includes(lang)} onPress={() => toggleLanguage(lang)} />
              ))}
            </View>
          </View>

          <View style={[styles.field, styles.urgentRow]}>
            <View style={styles.urgentTextBlock}>
              <Text style={styles.label}>Acil İlan</Text>
              <Text style={styles.urgentHint}>Bugün/yarın için personel lazımsa açık bırak — öne çıkar ve bildirim gönderilir.</Text>
            </View>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
              trackColor={{ false: Colors.inputBorder, true: AccentColor }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="İlan hakkında detaylar"
              placeholderTextColor={Colors.textPlaceholder}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>İlanı Yayınla</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.pageBackground },
  content: { padding: Spacing.four, gap: Spacing.three },
  field: { gap: Spacing.one },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
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
  photoPicker: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPickerText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  urgentTextBlock: { flex: 1, gap: 4 },
  urgentHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: Colors.accent, backgroundColor: 'rgba(217, 142, 74, 0.15)' },
  roleButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  roleButtonTextActive: { color: Colors.accent },
  error: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressedOpacity: { opacity: 0.8 },
});
