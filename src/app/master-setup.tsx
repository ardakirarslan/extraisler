import { router } from 'expo-router';
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
import { Colors } from '@/constants/auth-theme';
import { SERVICE_CATEGORIES } from '@/constants/master';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function MasterSetupScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    supabase
      .from('master_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setSkills(data.skills ?? []);
          setBio(data.bio ?? '');
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!userId) return;
    if (skills.length === 0) {
      setError('En az bir uzmanlık alanı seç.');
      return;
    }

    setSubmitting(true);
    const { error: upsertError } = await supabase.from('master_profiles').upsert({
      user_id: userId,
      skills,
      bio: bio.trim() || null,
    });
    setSubmitting(false);

    if (upsertError) {
      setError(upsertError.message);
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

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Usta Ol</Text>
          <Text style={styles.subtitle}>
            &quot;Bi&apos; Zahmet&quot; sisteminde hizmet talebi olan kullanıcılara teklif verebilmen için uzmanlık alanlarını seç.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Uzmanlık Alanları</Text>
            <View style={styles.chipsRow}>
              {SERVICE_CATEGORIES.map((skill) => (
                <Chip key={skill} label={skill} active={skills.includes(skill)} onPress={() => toggleSkill(skill)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Hakkımda (opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Deneyimin, çalışma bölgen vb. hakkında kısaca bahset"
              placeholderTextColor={Colors.textPlaceholder}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Kaydet</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.pageBackground },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  field: { gap: Spacing.one },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    marginTop: Spacing.one,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressedOpacity: { opacity: 0.8 },
});
