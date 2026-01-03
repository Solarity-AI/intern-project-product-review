import React, { useEffect, useMemo, useState } from 'react';
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

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { SearchBar } from '../components/SearchBar';
import { useNotifications } from '../context/NotificationContext';

import { RootStackParamList } from '../types';
import { Colors, Spacing, FontWeight, BorderRadius } from '../constants/theme';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const { unreadCount } = useNotifications();

  const { width } = useWindowDimensions();
  const numColumns =
    width >= 1200 ? 4 :
      width >= 900 ? 3 :
        width >= 600 ? 2 : 1;

  const isWeb = Platform.OS === 'web';

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const page = await getProducts({ page: 0, size: 50, sort: 'name,asc' });
        if (mounted) setApiProducts(page.content ?? []);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'API error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of apiProducts) {
      const c = (p as any)?.category;
      if (typeof c === 'string' && c.trim()) set.add(c.trim());
    }
    return ['All', ...Array.from(set)];
  }, [apiProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return apiProducts.filter((p) => {
      const name = String((p as any)?.name ?? '').toLowerCase();
      const category = String((p as any)?.category ?? '').toLowerCase();

      const matchCategory =
        selectedCategory === 'All'
          ? true
          : String((p as any)?.category ?? '') === selectedCategory;

      const matchSearch =
        q.length === 0 ? true : name.includes(q) || category.includes(q);

      return matchCategory && matchSearch;
    });
  }, [apiProducts, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const totalReviews = apiProducts.reduce((acc, p) => acc + ((p as any)?.reviewCount ?? 0), 0);
    const sumRating = apiProducts.reduce((acc, p) => acc + ((p as any)?.averageRating ?? 0), 0);
    const avgRating = apiProducts.length > 0 ? sumRating / apiProducts.length : 0;

    return { totalReviews, avgRating, productCount: apiProducts.length };
  }, [apiProducts]);

  const header = useMemo(() => {
    return (
      <View>
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Ionicons name="pricetag" size={18} color={colors.primaryForeground} />
            </LinearGradient>
            <Text style={[styles.brandText, { color: colors.foreground }]}>ProductReview</Text>
          </View>

          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.9}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Find Products You’ll Love
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="star" size={16} color={colors.starFilled} />
              <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>
                {stats.avgRating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.heroStatItem}>
              <Ionicons name="chatbubbles" size={16} color={colors.primary} />
              <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>
                {stats.totalReviews} reviews
              </Text>
            </View>

            <View style={styles.heroStatItem}>
              <Ionicons name="cube" size={16} color={colors.accentForeground} />
              <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>
                {stats.productCount} items
              </Text>
            </View>
          </View>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        <View style={{ marginTop: Spacing.md }}>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Products</Text>
      </View>
    );
  }, [
    colors,
    navigation,
    unreadCount,
    searchQuery,
    selectedCategory,
    categories,
    stats.avgRating,
    stats.productCount,
    stats.totalReviews,
  ]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: colors.mutedForeground }}>Loading products...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: colors.destructive, fontWeight: FontWeight.semibold }}>{error}</Text>
          <Text style={{ marginTop: 8, color: colors.mutedForeground }}>
            Please check API connection and try again.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={filteredProducts}
        key={numColumns}
        keyExtractor={(item) => String(item.id)}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={[styles.listContent, isWeb && styles.webMaxWidth]}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View
            style={[
              numColumns > 1 && styles.gridItem,
              numColumns > 1 && { width: `${100 / numColumns}%` }, // ✅ tek kalan full olmaz
            ]}
          >
            <ProductCard product={item} />
          </View>
        )}

        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListEmptyComponent={
          <View style={{ padding: Spacing.xl }}>
            <Text style={{ color: colors.mutedForeground }}>No products found.</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },

  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  logo: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: { fontSize: 16, fontWeight: FontWeight.bold },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

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

  heroCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },

  heroTitle: { fontSize: 18, fontWeight: FontWeight.bold, marginBottom: Spacing.md },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },

  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { fontSize: 13, fontWeight: FontWeight.medium },

  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },

  listContent: {
    paddingBottom: Spacing['3xl'] ?? 48, // theme’de 3xl yoksa fallback
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  columnWrapper: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
