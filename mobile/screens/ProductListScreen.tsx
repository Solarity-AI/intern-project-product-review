// React Native ProductListScreen with Server-side Filtering + Dark Mode Toggle + Grid Layout Toggle
// ✨ Fixed: Double request issue resolved by using useRef to track fetch state
// ✨ Added: Sort preference persistence with AsyncStorage
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, ApiProduct } from '../services/api';
import { TouchableWithoutFeedback } from 'react-native';

const SORT_STORAGE_KEY = 'user_sort_preference';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';

import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { ProductCard } from '../components/ProductCard';
import { SelectableProductCard } from '../components/SelectableProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { SortFilter } from '../components/SortFilter';
import { SearchBar } from '../components/SearchBar';
import { LoadMoreCard } from '../components/LoadMoreCard';
import { useNotifications } from '../context/NotificationContext';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';

import { RootStackParamList } from '../types';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductList'>>();
  const { colors, colorScheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { wishlistCount } = useWishlist();
  const { addSearchTerm, searchHistory } = useSearch();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // ✨ Refs to prevent double fetching
  const isFetchingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');
  const isInitialMountRef = useRef(true);

  // Grid mode: 1, 2, 4 columns (cycles)
  const [gridMode, setGridMode] = useState<1 | 2 | 4>(2);
  
  const numColumns = gridMode;

  // Multi-select mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { addToWishlist, addMultipleToWishlist, isInWishlist } = useWishlist();


  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const initialCategory = (route.params as any)?.category || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name,asc');
  const [sortLoaded, setSortLoaded] = useState(false); // ✨ Sort yüklenene kadar bekle

  // ✨ Load saved sort preference on mount
  useEffect(() => {
    const loadSortPreference = async () => {
      try {
        const savedSort = await AsyncStorage.getItem(SORT_STORAGE_KEY);
        if (savedSort) {
          console.log('Loaded sort preference:', savedSort);
          setSortBy(savedSort);
        }
      } catch (error) {
        console.error('Error loading sort preference:', error);
      } finally {
        setSortLoaded(true);
      }
    };
    loadSortPreference();
  }, []);

  // ✨ Save sort preference when it changes
  const saveSortPreference = async (sort: string) => {
    try {
      await AsyncStorage.setItem(SORT_STORAGE_KEY, sort);
      console.log('Saved sort preference:', sort);
    } catch (error) {
      console.error('Error saving sort preference:', error);
    }
  };

  useEffect(() => {
    if ((route.params as any)?.category) {
      setSelectedCategory((route.params as any).category);
    }
  }, [route.params]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        console.log('Setting debounced search query:', searchQuery);
        setDebouncedSearchQuery(searchQuery);
        if (searchQuery.trim().length > 0) {
          addSearchTerm(searchQuery);
        }
      }
    }, 500); // ✨ Reduced from 1000ms to 500ms for better UX

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle grid: 1 → 2 → 4 → 1
  const toggleGridMode = () => {
    setGridMode(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  // Get icon for current grid mode
  const getGridIcon = (): keyof typeof Ionicons.glyphMap => {
    if (gridMode === 1) return 'list';
    if (gridMode === 2) return 'grid';
    return 'apps'; // 4 columns
  };


  // Selection handlers
  const handleCardPress = (product: ApiProduct) => {
    if (isSelectionMode) {
      const productId = String((product as any)?.id ?? '');
      const newSelected = new Set(selectedItems);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      setSelectedItems(newSelected);
      if (newSelected.size === 0) {
        setIsSelectionMode(false);
      }
    } else {
      navigation.navigate('ProductDetails', {
        productId: String((product as any)?.id ?? ''),
        imageUrl: (product as any)?.imageUrl,
        name: (product as any)?.name,
      } as any);
    }
  };

  const handleCardLongPress = (product: ApiProduct) => {
    const productId = String((product as any)?.id ?? '');
    setIsSelectionMode(true);
    setSelectedItems(new Set([productId]));
  };

  // Bulk add selected products to wishlist (professional method name)
  const handleAddMultiple = () => {
    // Convert Set to Array for processing
    const selectedProductIds = Array.from(selectedItems);
    
    // Build wishlist items array
    const itemsToAdd: Array<Omit<WishlistItem, 'addedAt'>> = [];
    
    selectedProductIds.forEach(productId => {
      const product = apiProducts.find(p => String((p as any)?.id) === productId);
      if (product) {
        itemsToAdd.push({
          id: productId,
          name: (product as any)?.name ?? 'Product',
          price: (product as any)?.price,
          imageUrl: (product as any)?.imageUrl,
          category: (product as any)?.category,
          averageRating: (product as any)?.averageRating,
        });
      }
    });
    
    // Add all items to wishlist in one optimized batch
    addMultipleToWishlist(itemsToAdd);
    
    // Reset selection state
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  // ✨ Optimized fetchProducts with duplicate request prevention
  const fetchProducts = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    // Create a unique key for this request
    const fetchKey = `${pageNum}-${selectedCategory}-${sortBy}-${debouncedSearchQuery}-${append}`;
    
    // ✨ Prevent duplicate requests
    if (isFetchingRef.current && !append) {
      console.log('Skipping duplicate fetch request');
      return;
    }
    
    // ✨ Skip if same params (for non-append requests)
    if (!append && lastFetchParamsRef.current === fetchKey) {
      console.log('Skipping fetch - same params as last request');
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchParamsRef.current = fetchKey;
      
      console.log(`Fetching products: page=${pageNum}, search="${debouncedSearchQuery}", category=${selectedCategory}`);
      
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const page = await getProducts({ 
        page: pageNum, 
        size: 20,
        sort: sortBy,
        category: selectedCategory,
        search: debouncedSearchQuery
      });
      
      const newProducts = page?.content ?? [];
      console.log(`Fetched ${newProducts.length} products`);
      
      if (append) {
        setApiProducts(prev => [...prev, ...newProducts]);
      } else {
        setApiProducts(newProducts);
      }
      
      setCurrentPage(pageNum);
      setTotalPages(page?.totalPages ?? 0);
      setHasMore(!page?.last);
      setTotalProductsCount(page?.totalElements ?? 0);
      
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(e?.message ?? 'API error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedCategory, sortBy, debouncedSearchQuery]);

  // ✨ Single useEffect for fetching - replaces both useEffect and useFocusEffect
  // ✨ Wait for sort preference to load before fetching
  useEffect(() => {
    // Don't fetch until sort preference is loaded
    if (!sortLoaded) {
      return;
    }
    
    // Skip initial mount to prevent double fetch
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      fetchProducts(0, false);
      return;
    }
    
    // Fetch on filter/sort/search changes
    fetchProducts(0, false);
  }, [selectedCategory, sortBy, debouncedSearchQuery, sortLoaded]);

  // ✨ useFocusEffect only for refetch when returning to screen (optional refresh)
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we have stale data (e.g., returning from another screen)
      // This is now optional - remove if you don't want auto-refresh on focus
      // fetchProducts(0, false);
      
      // Do nothing - data is already loaded
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMore && !loading && !isFetchingRef.current) {
      fetchProducts(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, loading, currentPage, fetchProducts]);

  const filteredProducts = apiProducts;

  const stats = useMemo(() => {
    const totalReviews = apiProducts.reduce((acc, p) => acc + ((p as any)?.reviewCount ?? 0), 0);
    const sumRating = apiProducts.reduce((acc, p) => acc + ((p as any)?.averageRating ?? 0), 0);
    const avgRating = apiProducts.length > 0 ? sumRating / apiProducts.length : 0;

    return {
      totalReviews,
      avgRating,
      productCount: totalProductsCount,
    };
  }, [apiProducts, totalProductsCount]);

  const handleSearchSubmit = (term: string) => {
    setSearchQuery(term);
    addSearchTerm(term);
  };

  const handleCategoryChange = (category: string) => {
    // ✨ Only update if category actually changed
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      if (Platform.OS === 'web') {
        navigation.setParams({ category } as any);
      }
    }
  };

  // ✨ Handle sort change with duplicate prevention and persistence
  const handleSortChange = (sort: string) => {
    if (sort !== sortBy) {
      setSortBy(sort);
      saveSortPreference(sort); // ✨ Save to AsyncStorage
    }
  };

  // ✨ Reset all filters to default state
  const handleReset = () => {
    // ✨ Reset lastFetchParams to force a new fetch
    lastFetchParamsRef.current = '';
    
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('All');
    setSortBy('name,asc');
    if (Platform.OS === 'web') {
      navigation.setParams({ category: 'All', search: '' } as any);
    }
  };

  const topHeader = (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleReset} style={styles.logoContainer}>
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.logoIcon}>
            <Ionicons name="star" size={16} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.foreground }]}>ProductReview</Text>
        </TouchableOpacity>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.secondary }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={colorScheme === 'dark' ? 'sunny' : 'moon'} 
              size={20} 
              color={colors.foreground} 
            />
          </TouchableOpacity>

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
    </View>
  );

  const listHeader = (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Products</Text>
      </View>

      <View style={styles.categoryFilterWrapper}>
        <CategoryFilter 
          selectedCategory={selectedCategory} 
          onCategoryChange={handleCategoryChange}
        />
      </View>

      <View style={styles.sortFilterWrapper}>
        <View style={styles.sortHeader}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Sort by:</Text>
          
          <TouchableOpacity
            onPress={toggleGridMode}
            style={[styles.gridToggleButton, { backgroundColor: colors.secondary }]}
            activeOpacity={0.8}
          >
            <Ionicons name={getGridIcon()} size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        
        {/* ✨ Use handleSortChange instead of setSortBy directly */}
        <SortFilter selectedSort={sortBy} onSortChange={handleSortChange} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.destructive, padding: Spacing.lg }}>{error}</Text>}
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <TouchableWithoutFeedback onPress={() => {
        if (isSelectionMode && selectedItems.size > 0) {
          handleCancelSelection();
        }
      }}>
        <View style={{ flex: 1 }}>
          {/* ✨ Static Header (TopBar + Hero + Search) */}
          <View style={{ zIndex: 100 }}>
            {topHeader}
            <View style={styles.searchSection}>
              <SearchBar 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                onSearchSubmit={handleSearchSubmit}
              />
            </View>
          </View>

          {/* ✨ Product List */}
          <FlatList
            data={filteredProducts}
            key={`${numColumns}-${isSelectionMode ? 'select' : 'normal'}`}
            numColumns={numColumns}
            keyExtractor={(item) => String((item as any)?.id)}
            ListHeaderComponent={listHeader}
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
                  numColumns > 1 && { flex: 1, maxWidth: `${100 / numColumns - 1}%` },
                  numColumns === 1 && { paddingHorizontal: Spacing.lg },
                ]}
              >
                <SelectableProductCard
                  product={item}
                  numColumns={numColumns}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedItems.has(String((item as any)?.id ?? ''))}
                  onPress={handleCardPress}
                  onLongPress={handleCardLongPress}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            
            ListFooterComponent={
              <>
                {filteredProducts.length > 0 && (
                  <LoadMoreCard
                    onPress={loadMoreProducts}
                    loading={loadingMore}
                    hasMore={hasMore}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                )}
              </>
            }
            
            ListEmptyComponent={
              !loading ? (
                <View style={{ padding: Spacing.xl, zIndex: -1 }}>
                  <Text style={{ color: colors.mutedForeground }}>No products found.</Text>
                </View>
              ) : null
            }
          />

          {/* Floating action bar */}
          {isSelectionMode && selectedItems.size > 0 && (
            <View style={[styles.floatingBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.floatingButton, styles.cancelButton]}
                onPress={handleCancelSelection}
                activeOpacity={0.8}
              >
                <Text style={[styles.floatingButtonText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingButton, styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMultiple}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={[styles.floatingButtonText, { color: '#fff' }]}>
                  Add to Wishlist ({selectedItems.size})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
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

  themeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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

  searchSection: { 
    paddingVertical: Spacing.lg,
    zIndex: 9999,
    elevation: 20,
  },

  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

  categoryFilterWrapper: {
    marginBottom: Spacing.lg,
  },

  sortFilterWrapper: {
    marginBottom: Spacing.lg,
  },

  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  gridToggleButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.sm,
    zIndex: -1,
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

  floatingBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  addButton: {
    // backgroundColor set inline
  },
  floatingButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});