// React Native ProductListScreen with Server-side Filtering
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
import { SortFilter } from '../components/SortFilter';
import { SearchBar } from '../components/SearchBar';
import { useNotifications } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';

import { RootStackParamList } from '../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const { unreadCount } = useNotifications();
  const { wishlistCount } = useWishlist();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const numColumns =
    width >= 1200 ? 4 :
    width >= 900 ? 3 :
    width >= 600 ? 2 : 1;

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name,asc'); // Sort state

  // Fetch products from backend with category filter and pagination
  const fetchProducts = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      console.log('🚀 Fetching page:', pageNum, 'Append mode:', append);
      
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Pass selectedCategory and sort to backend
      const page = await getProducts({ 
        page: pageNum, 
        size: 20, // Reduced from 50 for better pagination
        sort: sortBy,
        category: selectedCategory 
      });
      
      console.log('📦 Received products:', page?.content?.length);
      console.log('📄 Total pages:', page?.totalPages);
      console.log('🔚 Is last page?', page?.last);
      console.log('📊 Current total products in list:', apiProducts.length + (page?.content?.length ?? 0));
      
      const newProducts = page?.content ?? [];
      
      if (append) {
        setApiProducts(prev => {
          console.log('➕ Appending to existing list. Old:', prev.length, 'New:', newProducts.length);
          return [...prev, ...newProducts];
        });
      } else {
        console.log('🔄 Replacing list with', newProducts.length, 'products');
        setApiProducts(newProducts);
      }
      
      setCurrentPage(pageNum);
      setTotalPages(page?.totalPages ?? 0);
      setHasMore(!page?.last);
      
    } catch (e: any) {
      console.error('❌ Error fetching products:', e?.message);
      setError(e?.message ?? 'API error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, apiProducts.length]);

  useEffect(() => {
    fetchProducts(0, false);
  }, [selectedCategory, sortBy]); // Reset to page 0 when category or sort changes

  useFocusEffect(
    useCallback(() => {
      fetchProducts(0, false);
    }, [selectedCategory, sortBy])
  );

  // Load more products (infinite scroll)
  const loadMoreProducts = useCallback(() => {
    console.log('📜 Scroll trigger - loadingMore:', loadingMore, 'hasMore:', hasMore, 'loading:', loading);
    
    if (!loadingMore && hasMore && !loading) {
      console.log('✅ Loading next page:', currentPage + 1);
      fetchProducts(currentPage + 1, true);
    } else {
      console.log('⏸️  Load more blocked:', { loadingMore, hasMore, loading });
    }
  }, [loadingMore, hasMore, loading, currentPage, fetchProducts]);

  // Client-side filtering only for search query
  const filteredProducts = useMemo(() => {
    let filtered = apiProducts;

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
  }, [apiProducts, searchQuery]);

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

  const header = useMemo(() => (
    <View>
            <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.logoIcon}>
            <Ionicons name="star" size={16} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.foreground }]}>ProductReview</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => navigation.navigate('Wishlist')}
            activeOpacity={0.8}
          >
            <Ionicons name="heart-outline" size={22} color={colors.foreground} />
            {wishlistCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>

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

      <View style={styles.categoryFilterWrapper}>
        <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </View>

      <View style={styles.sortFilterWrapper}>
        <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Sort by:</Text>
        <SortFilter selectedSort={sortBy} onSortChange={setSortBy} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.destructive, padding: Spacing.lg }}>{error}</Text>}
    </View>
  ), [
    colors,
    navigation,
    unreadCount,
    wishlistCount,
    stats,
    searchQuery,
    selectedCategory,
    sortBy,
    loading,
    error,
  ]);

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <FlatList
        data={filteredProducts}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => String((item as any)?.id)}
        ListHeaderComponent={header}
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.webMaxWidth,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ItemSeparatorComponent={numColumns === 1 ? () => <View style={{ height: Spacing.md }} /> : undefined}
        renderItem={({ item }) => (
          <View
            style={[
              numColumns > 1 && styles.gridItem,
              numColumns > 1 && { width: `${100 / numColumns}%` },
              numColumns === 1 && { paddingHorizontal: Spacing.lg },
            ]}
          >
            <ProductCard product={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        
        
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, marginTop: Spacing.sm, fontSize: 12 }}>
                Loading more products...
              </Text>
            </View>
          ) : null
        }
        
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

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  wishlistButton: { 
    position: 'relative', 
    padding: Spacing.xs,
  },

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

  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

  categoryFilterWrapper: {
    marginBottom: Spacing.lg,
  },

  sortFilterWrapper: {
    marginBottom: Spacing.lg,
  },

  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  listContent: {
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.sm,
  },

  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
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