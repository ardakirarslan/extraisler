import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobDetailTheme as Theme } from '@/constants/job-detail-theme';
import { Spacing } from '@/constants/theme';

// TODO: Gerçek destek WhatsApp numarasıyla değiştir (uluslararası format, boşluksuz).
const SUPPORT_WHATSAPP_NUMBER = '905000000000';

const FAQ_ITEMS = [
  {
    question: 'Bir ilana nasıl başvururum?',
    answer: 'İş İlanları sekmesinden bir ilana girip "Başvur" butonuna dokun. İstersen arkadaşlarınla birlikte ekip olarak da başvurabilirsin.',
  },
  {
    question: 'Nasıl usta olabilirim?',
    answer: 'Profilim ekranından "Usta Ol" butonuna dokunup uzmanlık alanlarını seç. Onayladıktan sonra "Bi\' Zahmet" taleplerine teklif verebilirsin.',
  },
  {
    question: 'Ödeme nasıl yapılıyor?',
    answer: 'Extra İşler ödeme işlemlerine aracılık etmez — ücret, işveren/usta ve işçi/talep sahibi arasında doğrudan, uygulama dışında kararlaştırılır.',
  },
  {
    question: 'Bir sorunla karşılaştım, ne yapmalıyım?',
    answer: 'Aşağıdaki "WhatsApp\'tan Yaz" butonuyla bize doğrudan ulaşabilirsin, sorununu en kısa sürede çözmeye çalışırız.',
  },
];

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable style={styles.faqRow} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Theme.mutedForeground} />
      </Pressable>
      {open && <Text style={styles.faqAnswer}>{answer}</Text>}
    </View>
  );
}

export default function SupportCenterScreen() {
  const handleWhatsApp = async () => {
    const text = encodeURIComponent('Merhaba, Extra İşler uygulamasıyla ilgili destek almak istiyorum.');
    const appUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${text}`;
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`);
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Destek Merkezi</Text>
          <Text style={styles.subtitle}>Sık sorulan sorular ve bize ulaşma yolları.</Text>

          <View style={styles.card}>
            {FAQ_ITEMS.map((item, index) => (
              <View key={item.question}>
                <FaqRow question={item.question} answer={item.answer} />
                {index < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.whatsappButton, pressed && styles.pressed]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
            <Text style={styles.whatsappButtonText}>WhatsApp&apos;tan Yaz</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 26, fontWeight: '800', color: Theme.primary },
  subtitle: { fontSize: 14, color: Theme.mutedForeground },
  card: { backgroundColor: Theme.card, borderRadius: 20, padding: Spacing.two },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.two },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: Theme.foreground, paddingRight: Spacing.two },
  faqAnswer: { fontSize: 13, color: Theme.mutedForeground, lineHeight: 20, paddingHorizontal: Spacing.two, paddingBottom: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Theme.border, marginHorizontal: Spacing.two },
  pressed: { opacity: 0.85 },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 15,
  },
  whatsappButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
