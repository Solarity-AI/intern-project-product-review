// React Native ProductListScreen with SafeArea fix and Notifications header button
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts, ApiProduct } from '../services/api';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { SearchBar } from '../components/SearchBar';
import { useNotifications } from '../context/NotificationContext';

import { RootStackParamList } from '../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const { unreadCount } = useNotifications();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // ✅ Web’de responsive grid (tek kalan item full genişlemesin diye % width kullanacağız)
  const numColumns =
    width >= 1200 ? 4 :
    width >= 900 ? 3 :
    width >= 600 ? 2 : 1;

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Fetch fonksiyonu: hem ilk load hem de geri dönünce refresh için tek yerden yönetiyoruz
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await getProducts({ page: 0, size: 50, sort: 'name,asc' });
      setApiProducts(page?.content ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'API error');
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk açılış
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ KRİTİK FIX: Ekran geri focus olunca yeniden fetch → reviewCount/avgRating/stats güncellenir
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const filteredProducts = useMemo(() => {
    let filtered = apiProducts;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => (p as any)?.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = String((p as any)?.name ?? '').toLowerCase();
        const description = String((p as any)?.description ?? '').toLowerCase();
        const category = String((p as any)?.category ?? '').toLowerCase();
        return (
          name.includes(query) ||
          description.includes(query) ||
          category.includes(query)
        );
      });
    }

    return filtered;
  }, [apiProducts, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const totalReviews = apiProducts.reduce((acc, p) => acc + ((p as any)?.reviewCount ?? 0), 0);
    const sumRating = apiProducts.reduce((acc, p) => acc + ((p as any)?.averageRating ?? 0), 0);
    const avgRating = apiProducts.length > 0 ? sumRating / apiProducts.length : 0;

    return {
      totalReviews,
      avgRating,
      productCount: apiProducts.length,
    };
  }, [apiProducts]);

  /**
   * ✅ Header memoized (Search typing sırasında re-render patlamasın)
   */
  const header = useMemo(() => (
    <View>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.logoIcon}>
            <Ionicons name="star" size={16} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.foreground }]}>ProductReview</Text>
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.heroSection, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Find Products You&apos;ll <Text style={{ color: colors.primary }}>Love</Text>
        </Text>

        <View style={styles.statsRow}>
          {[
            { icon: 'star', value: stats.avgRating.toFixed(1), label: 'Avg Rating' },
            { icon: 'chatbubbles', value: stats.totalReviews.toLocaleString(), label: 'Reviews' },
            { icon: 'cube', value: String(stats.productCount), label: 'Products' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={18} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.searchSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Products</Text>
      </View>

      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.destructive, padding: Spacing.lg }}>{error}</Text>}
    </View>
  ), [
    colors,
    navigation,
    unreadCount,
    stats,
    searchQuery,
    selectedCategory,
    loading,
    error,
  ]);

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <FlatList
        data={filteredProducts}
        // ✅ numColumns değişince layout resetlensin
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => String((item as any)?.id)}
        ListHeaderComponent={header}
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.webMaxWidth,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => (
          <View
            style={[
              numColumns > 1 && styles.gridItem,
              // ✅ Tek kalan item "full width" olmasın → her item kendi % genişliğinde kalsın
              numColumns > 1 && { width: `${100 / numColumns}%` },
            ]}
          >
            <ProductCard product={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: Spacing.xl }}>
              <Text style={{ color: colors.mutedForeground }}>No products found.</Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  notificationButton: { position: 'relative', padding: Spacing.xs },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  heroSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },

  heroTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    flexWrap: 'wrap',
  },

  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs },

  searchSection: { paddingVertical: Spacing.lg },

  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

  listContent: {
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.sm,
  },

  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },

  gridItem: {
    minWidth: 0,
  },

  webMaxWidth: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
});