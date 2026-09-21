import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    Keyboard.dismiss();
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google ile giriş yapılamadı.');
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
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>EI</Text>
            </View>
            <Text style={styles.title}>Extra İşler</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>

            <View style={styles.card}>
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
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textPlaceholder}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  value={password}
                  onChangeText={setPassword}
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
                  <Text style={styles.primaryButtonText}>Giriş Yap</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.googleButton, pressed && styles.pressedOpacity]}
                onPress={handleGoogle}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>Google ile devam et</Text>
              </Pressable>
            </View>

            <Link href="/register" asChild>
              <Pressable style={styles.linkRow} hitSlop={8}>
                <Text style={styles.linkText}>
                  Hesabın yok mu? <Text style={styles.linkTextBold}>Kayıt ol</Text>
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
  logoBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoBadgeText: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.inputBorder },
  dividerText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingVertical: 14,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  linkTextBold: { color: Colors.accent, fontWeight: '700' },
});
