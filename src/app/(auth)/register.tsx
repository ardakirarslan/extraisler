import { Link } from 'expo-router';
import { useState } from 'react';
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

import { Colors } from '@/constants/auth-theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { UserRole } from '@/types/database';

export default function RegisterScreen() {
  const { signUpWithPassword, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setSubmitting(true);
    try {
      await signUpWithPassword(email.trim(), password);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ id: userId, name: name.trim(), role, email: email.trim() });
        if (upsertError) throw upsertError;
        await refreshProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt olunamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Extra İşler&apos;e hoş geldin</Text>

            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Ad Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adın Soyadın"
                  placeholderTextColor={Colors.textPlaceholder}
                  returnKeyType="next"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Şifre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={Colors.textPlaceholder}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Rol</Text>
                <View style={styles.roleRow}>
                  <Pressable
                    style={[styles.roleButton, role === 'worker' && styles.roleButtonActive]}
                    onPress={() => setRole('worker')}>
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'worker' && styles.roleButtonTextActive,
                      ]}>
                      İşçi
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleButton, role === 'employer' && styles.roleButtonActive]}
                    onPress={() => setRole('employer')}>
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'employer' && styles.roleButtonTextActive,
                      ]}>
                      İşveren
                    </Text>
                  </Pressable>
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedOpacity]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
                )}
              </Pressable>
            </View>

            <Link href="/login" asChild>
              <Pressable style={styles.linkRow} hitSlop={8}>
                <Text style={styles.linkText}>
                  Zaten hesabın var mı? <Text style={styles.linkTextBold}>Giriş yap</Text>
                </Text>
              </Pressable>
            </Link>
          </ScrollView>
        </SafeAreaView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.pageBackground },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
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
  error: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  pressedOpacity: { opacity: 0.8 },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  linkTextBold: { color: Colors.accent, fontWeight: '700' },
});
