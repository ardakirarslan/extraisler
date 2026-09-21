import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { Colors as AuthColors } from '@/constants/auth-theme';
import { COMMON_LANGUAGES, MUGLA_DISTRICTS } from '@/constants/locations';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { AvailabilityStatus } from '@/types/database';

function WorkerFields({
  skills,
  onAddSkill,
  onRemoveSkill,
  availabilityStatus,
  onChangeAvailabilityStatus,
  availableFrom,
  onChangeAvailableFrom,
  availableTo,
  onChangeAvailableTo,
  bio,
  onChangeBio,
  district,
  onChangeDistrict,
  languages,
  onToggleLanguage,
}: {
  skills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  availabilityStatus: AvailabilityStatus;
  onChangeAvailabilityStatus: (status: AvailabilityStatus) => void;
  availableFrom: Date | null;
  onChangeAvailableFrom: (date: Date) => void;
  availableTo: Date | null;
  onChangeAvailableTo: (date: Date) => void;
  bio: string;
  onChangeBio: (bio: string) => void;
  district: string | null;
  onChangeDistrict: (district: string | null) => void;
  languages: string[];
  onToggleLanguage: (lang: string) => void;
}) {
  const [skillDraft, setSkillDraft] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const addDraftSkill = () => {
    const trimmed = skillDraft.trim();
    if (!trimmed) return;
    onAddSkill(trimmed);
    setSkillDraft('');
  };

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Yetenekler</Text>
        <View style={styles.skillInputRow}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Örn. Garson"
            placeholderTextColor={AuthColors.textPlaceholder}
            value={skillDraft}
            onChangeText={setSkillDraft}
            onSubmitEditing={addDraftSkill}
            returnKeyType="done"
          />
          <Pressable style={styles.addSkillButton} onPress={addDraftSkill}>
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>
        {skills.length > 0 && (
          <View style={styles.skillChipsRow}>
            {skills.map((skill) => (
              <Pressable key={skill} style={styles.skillChip} onPress={() => onRemoveSkill(skill)}>
                <Text style={styles.skillChipText}>{skill}</Text>
                <Ionicons name="close" size={14} color={AuthColors.accent} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Müsaitlik Durumu</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleButton, availabilityStatus === 'available' && styles.roleButtonActive]}
            onPress={() => onChangeAvailabilityStatus('available')}>
            <Text
              style={[styles.roleButtonText, availabilityStatus === 'available' && styles.roleButtonTextActive]}>
              Müsait
            </Text>
          </Pressable>
          <Pressable
            style={[styles.roleButton, availabilityStatus === 'unavailable' && styles.roleButtonActive]}
            onPress={() => onChangeAvailabilityStatus('unavailable')}>
            <Text
              style={[styles.roleButtonText, availabilityStatus === 'unavailable' && styles.roleButtonTextActive]}>
              Müsait Değil
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.dateRow}>
        <View style={[styles.field, styles.dateField]}>
          <Text style={styles.label}>Müsait Olduğu Tarih (başlangıç)</Text>
          <Pressable style={styles.input} onPress={() => setShowFromPicker(true)}>
            <Text style={{ color: AuthColors.textPrimary }}>
              {availableFrom ? availableFrom.toISOString().slice(0, 10) : 'Seç (opsiyonel)'}
            </Text>
          </Pressable>
          {showFromPicker && (
            <DateTimePicker
              value={availableFrom ?? new Date()}
              mode="date"
              onChange={(_event, date) => {
                setShowFromPicker(Platform.OS === 'ios');
                if (date) onChangeAvailableFrom(date);
              }}
            />
          )}
        </View>
        <View style={[styles.field, styles.dateField]}>
          <Text style={styles.label}>Bitiş</Text>
          <Pressable style={styles.input} onPress={() => setShowToPicker(true)}>
            <Text style={{ color: AuthColors.textPrimary }}>
              {availableTo ? availableTo.toISOString().slice(0, 10) : 'Seç (opsiyonel)'}
            </Text>
          </Pressable>
          {showToPicker && (
            <DateTimePicker
              value={availableTo ?? new Date()}
              mode="date"
              onChange={(_event, date) => {
                setShowToPicker(Platform.OS === 'ios');
                if (date) onChangeAvailableTo(date);
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>İlçe</Text>
        <View style={styles.skillChipsRow}>
          {MUGLA_DISTRICTS.map((d) => (
            <Chip key={d} label={d} active={district === d} onPress={() => onChangeDistrict(district === d ? null : d)} />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Konuştuğun Diller (opsiyonel)</Text>
        <View style={styles.skillChipsRow}>
          {COMMON_LANGUAGES.map((lang) => (
            <Chip key={lang} label={lang} active={languages.includes(lang)} onPress={() => onToggleLanguage(lang)} />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hakkımda</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Kısaca kendinden bahset"
          placeholderTextColor={AuthColors.textPlaceholder}
          value={bio}
          onChangeText={onChangeBio}
          multiline
        />
      </View>
    </>
  );
}

/**
 * Shared worker/employer profile form. Used both for the mandatory first-time
 * setup (complete-profile.tsx) and later edits (edit-profile.tsx) — it always
 * loads whatever profile row already exists so re-submitting never silently
 * blanks out fields the user doesn't touch.
 */
export function ProfileForm({
  title,
  subtitle,
  submitLabel,
  onSaved,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSaved: () => void | Promise<void>;
}) {
  const { session, profile, refreshProfile } = useAuth();
  const isEmployer = profile?.role === 'employer';

  // worker fields
  const [skills, setSkills] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('available');
  const [availableFrom, setAvailableFrom] = useState<Date | null>(null);
  const [availableTo, setAvailableTo] = useState<Date | null>(null);
  const [bio, setBio] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);

  // employer fields
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const userId = session?.user.id;
      if (!userId || !profile?.role) {
        setLoading(false);
        return;
      }

      const table = isEmployer ? 'employer_profiles' : 'worker_profiles';
      const { data } = await supabase.from(table).select('*').eq('user_id', userId).maybeSingle();

      if (cancelled) return;
      if (data) {
        if (isEmployer && 'business_name' in data) {
          setBusinessName(data.business_name ?? '');
          setLocation(data.location ?? '');
          setDescription(data.description ?? '');
        } else if (!isEmployer && 'skills' in data) {
          setSkills(data.skills ?? []);
          setAvailabilityStatus(data.availability_status ?? 'available');
          setAvailableFrom(data.available_from ? new Date(data.available_from) : null);
          setAvailableTo(data.available_to ? new Date(data.available_to) : null);
          setBio(data.bio ?? '');
          setDistrict(data.district ?? null);
          setLanguages(data.languages ?? []);
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, profile?.role]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const userId = session?.user.id;
    if (!userId) return;

    if (isEmployer) {
      if (!businessName.trim() || !location.trim()) {
        setError('İşletme adı ve konum gerekli.');
        return;
      }
    } else {
      if (skills.length === 0) {
        setError('En az bir yetenek ekle.');
        return;
      }
      if (!bio.trim()) {
        setError('Kendinden kısaca bahset.');
        return;
      }
    }

    setSubmitting(true);
    const { error: upsertError } = isEmployer
      ? await supabase.from('employer_profiles').upsert({
          user_id: userId,
          business_name: businessName.trim(),
          location: location.trim(),
          description: description.trim() || null,
        })
      : await supabase.from('worker_profiles').upsert({
          user_id: userId,
          skills,
          availability_status: availabilityStatus,
          available_from: availableFrom ? availableFrom.toISOString().slice(0, 10) : null,
          available_to: availableTo ? availableTo.toISOString().slice(0, 10) : null,
          bio: bio.trim(),
          district,
          languages,
        });
    setSubmitting(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    await refreshProfile();
    await onSaved();
  };

  if (loading) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={AuthColors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.card}>
            {isEmployer ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>İşletme Adı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn. Luna Otel"
                    placeholderTextColor={AuthColors.textPlaceholder}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Konum</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn. Bodrum, Muğla"
                    placeholderTextColor={AuthColors.textPlaceholder}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder="İşletmen hakkında kısa bilgi (opsiyonel)"
                    placeholderTextColor={AuthColors.textPlaceholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
              </>
            ) : (
              <WorkerFields
                skills={skills}
                onAddSkill={(skill) => setSkills((prev) => [...new Set([...prev, skill])])}
                onRemoveSkill={(skill) => setSkills((prev) => prev.filter((s) => s !== skill))}
                availabilityStatus={availabilityStatus}
                onChangeAvailabilityStatus={setAvailabilityStatus}
                availableFrom={availableFrom}
                onChangeAvailableFrom={setAvailableFrom}
                availableTo={availableTo}
                onChangeAvailableTo={setAvailableTo}
                bio={bio}
                onChangeBio={setBio}
                district={district}
                onChangeDistrict={setDistrict}
                languages={languages}
                onToggleLanguage={(lang) =>
                  setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]))
                }
              />
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{submitLabel}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AuthColors.pageBackground },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 26, fontWeight: '700', color: AuthColors.textPrimary, marginTop: Spacing.three },
  subtitle: { fontSize: 15, color: AuthColors.textSecondary, marginBottom: Spacing.two },
  card: {
    backgroundColor: AuthColors.cardBackground,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: AuthColors.textSecondary },
  input: {
    backgroundColor: AuthColors.inputBackground,
    borderWidth: 1,
    borderColor: AuthColors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AuthColors.textPrimary,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  skillInputRow: { flexDirection: 'row', gap: 10 },
  skillInput: { flex: 1 },
  addSkillButton: {
    width: 50,
    borderRadius: 14,
    backgroundColor: AuthColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 142, 74, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillChipText: { color: AuthColors.accent, fontWeight: '600', fontSize: 13 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1,
    backgroundColor: AuthColors.inputBackground,
    borderWidth: 1.5,
    borderColor: AuthColors.inputBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: AuthColors.accent, backgroundColor: 'rgba(217, 142, 74, 0.15)' },
  roleButtonText: { fontSize: 15, fontWeight: '600', color: AuthColors.textSecondary },
  roleButtonTextActive: { color: AuthColors.accent },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1 },
  error: { color: AuthColors.error, fontSize: 13, fontWeight: '500' },
  primaryButton: {
    backgroundColor: AuthColors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressedOpacity: { opacity: 0.8 },
});
