import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/auth-theme';
import { Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (updateError) {
      setError(getErrorMessage(updateError, 'Şifre güncellenemedi.'));
      return;
    }

    setSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Şifre Değiştir</Text>
          <Text style={styles.subtitle}>Yeni şifreni gir ve onayla.</Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor={Colors.textPlaceholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={styles.input}
                placeholder="Yeni şifreni tekrar gir"
                placeholderTextColor={Colors.textPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {success && <Text style={styles.success}>Şifren başarıyla güncellendi.</Text>}

            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Şifreyi Güncelle</Text>}
            </Pressable>

            {success && (
              <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                <Text style={styles.secondaryButtonText}>Geri Dön</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.pageBackground },
  content: { padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.three },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.two },
  card: { backgroundColor: Colors.cardBackground, borderRadius: 20, padding: 20, gap: 14 },
  field: { gap: 6 },
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
  error: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  success: { color: '#12B76A', fontSize: 13, fontWeight: '600' },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryButtonText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },
  pressedOpacity: { opacity: 0.8 },
});
