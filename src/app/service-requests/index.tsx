import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SERVICE_CATEGORIES } from '@/constants/master';
import { AccentColor, CardShadow, CtaColor, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { ServiceRequest } from '@/types/database';

export default function ServiceRequestsListScreen() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      let query = supabase
        .from('service_requests')
        .select('*')
        .eq('status', 'open')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });
      if (categoryFilter) query = query.eq('category', categoryFilter);
      const trimmedSearch = searchText.trim();
      if (trimmedSearch) query = query.ilike('title', `%${trimmedSearch}%`);
      const { data, error } = await query;

      if (cancelled) return;
      if (error) {
        console.warn('Failed to load service requests:', error.message);
        setRequests([]);
      } else {
        setRequests(data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryFilter, searchText, refreshKey]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />
          }
          ListHeaderComponent={
            <ThemedView style={styles.headerStack}>
              <Link href="/service-requests/create" asChild>
                <Pressable style={({ pressed }) => [styles.newRequestButton, pressed && styles.cardPressed]}>
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <ThemedText type="default" style={styles.newRequestButtonText}>
                    Yeni Talep Oluştur
                  </ThemedText>
                </Pressable>
              </Link>
              <ThemedView style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color="#9AA0AC" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Talep başlığı ara"
                  placeholderTextColor="#9AA0AC"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </ThemedView>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={SERVICE_CATEGORIES as readonly string[]}
                keyExtractor={(c) => c}
                contentContainerStyle={styles.filterChips}
                renderItem={({ item: c }) => (
                  <Chip label={c} active={categoryFilter === c} onPress={() => setCategoryFilter(categoryFilter === c ? null : c)} />
                )}
              />
            </ThemedView>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="hammer-outline" size={32} color="#9AA0AC" />
                <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                  Şu an açık talep yok.
                </ThemedText>
              </ThemedView>
            ) : null
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/service-requests/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <ThemedView style={styles.cardHeader}>
                  <Badge label={item.category} tone="blue" />
                  {item.is_urgent && <Badge label="Acil" tone="red" />}
                </ThemedView>
                <ThemedText type="default" style={styles.cardTitle}>
                  {item.title}
                </ThemedText>
                <ThemedView style={styles.cardFooter}>
                  {item.location && (
                    <ThemedView style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.location}
                      </ThemedText>
                    </ThemedView>
                  )}
                  {item.price != null && (
                    <ThemedText type="smallBold" style={styles.price}>
                      {item.price} ₺
                    </ThemedText>
                  )}
                </ThemedView>
              </Pressable>
            </Link>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { padding: Spacing.four, gap: Spacing.three },
  headerStack: { gap: Spacing.three, marginBottom: Spacing.one, backgroundColor: 'transparent' },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CtaColor,
    borderRadius: Radius.button,
    paddingVertical: 14,
    shadowColor: CtaColor,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  newRequestButtonText: { color: '#ffffff', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...CardShadow,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#12141A' },
  filterChips: { flexDirection: 'row', gap: 8 },
  emptyState: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  cardTitle: { fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  price: { color: AccentColor },
});
