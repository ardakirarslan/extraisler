import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/auth-theme';
import { useOnboarding } from '@/providers/onboarding-provider';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'briefcase-outline',
    title: 'Sana Uygun İş İlanları',
    description: 'Muğla bölgesindeki turizm işletmelerinin günlük ve sezonluk iş ilanlarını keşfet, ilçe ve dil filtreleriyle sana uygun olanı bul.',
  },
  {
    icon: 'hammer-outline',
    title: "Bi' Zahmet ile Usta Bul",
    description: 'Küçük tamirat ve hizmet ihtiyaçların için talep oluştur, çevrendeki ustalardan teklif al, işini kolayca hallet.',
  },
  {
    icon: 'star-outline',
    title: 'Mesajlaş, Değerlendir',
    description: 'İşveren ve ustalarla doğrudan mesajlaş, tamamlanan işlerin sonunda birbirinizi puanlayarak güvenilir bir topluluk oluşturun.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;

  const goToIndex = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    goToIndex(index + 1);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <Pressable onPress={completeOnboarding} hitSlop={8}>
          <Text style={styles.skipText}>Geç</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? 'Hemen Başla' : 'İleri'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBackground },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  skipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0EBE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inputBorder },
  dotActive: { backgroundColor: Colors.accent, width: 20 },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
