import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { MUGLA_DISTRICTS } from '@/constants/locations';
import { SERVICE_CATEGORIES } from '@/constants/master';
import { AccentColor, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function CreateServiceRequestScreen() {
  const { session } = useAuth();

  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [neededDate, setNeededDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const userId = session?.user.id;
    if (!userId) return;

    if (!category) {
      setError('Bir kategori seç.');
      return;
    }
    if (!title.trim()) {
      setError('Başlık gerekli.');
      return;
    }
    if (!location) {
      setError('Bir konum seç.');
      return;
    }

    const trimmedPrice = price.trim();
    const parsedPrice = trimmedPrice ? parseFloat(trimmedPrice.replace(',', '.')) : null;
    if (trimmedPrice && (!Number.isFinite(parsedPrice) || (parsedPrice as number) < 0)) {
      setError('Geçerli bir fiyat girin.');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('service_requests').insert({
      requester_id: userId,
      category,
      title: title.trim(),
      description: description.trim() || null,
      price: parsedPrice,
      needed_date: neededDate.toISOString().slice(0, 10),
      location,
      is_urgent: isUrgent,
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.dismissTo('/service-requests');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.chipsRow}>
              {SERVICE_CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. Salonda priz arızası"
              placeholderTextColor={Colors.textPlaceholder}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Açıklama (opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="İş hakkında detaylar"
              placeholderTextColor={Colors.textPlaceholder}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fiyat Teklifin (₺, opsiyonel)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Örn. 500"
              placeholderTextColor={Colors.textPlaceholder}
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>İhtiyaç Tarihi</Text>
            <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: Colors.textPrimary }}>{neededDate.toISOString().slice(0, 10)}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={neededDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setNeededDate(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Konum</Text>
            <View style={styles.chipsRow}>
              {MUGLA_DISTRICTS.map((d) => (
                <Chip key={d} label={d} active={location === d} onPress={() => setLocation(location === d ? null : d)} />
              ))}
            </View>
          </View>

          <View style={[styles.field, styles.urgentRow]}>
            <View style={styles.urgentTextBlock}>
              <Text style={styles.label}>Acil Talep</Text>
              <Text style={styles.urgentHint}>Bugün/yarın için usta lazımsa açık bırak — liste başında öne çıkar.</Text>
            </View>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
              trackColor={{ false: Colors.inputBorder, true: AccentColor }}
              thumbColor="#ffffff"
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
              <Text style={styles.primaryButtonText}>Talebi Oluştur</Text>
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
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  urgentTextBlock: { flex: 1, gap: 4 },
  urgentHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
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
