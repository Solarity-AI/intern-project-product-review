// React Native ProductListScreen with Server-side Filtering + Dark Mode Toggle + Grid Layout Toggle
// ✨ Fixed: Double request issue resolved by using useRef to track fetch state
// ✨ Added: Sort preference persistence with AsyncStorage
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, getGlobalStats, ApiProduct, GlobalStats } from '../services/api';
import { TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native'; // ✨ Added DeviceEventEmitter

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
} from 'react-native';

import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectableProductCard } from '../components/SelectableProductCard';
import { SearchBar } from '../components/SearchBar';
import { LoadMoreCard } from '../components/LoadMoreCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { CategoryFilter } from '../components/CategoryFilter';
import { SortFilter } from '../components/SortFilter';
import { useNotifications } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { useNetwork } from '../context/NetworkContext';

import { RootStackParamList } from '../types';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ProductListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductList'>;

export const ProductListScreen = () => {
  const navigation = useNavigation<ProductListNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductList'>>();
  const { colors, colorScheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { wishlistCount, addMultipleToWishlist, isInWishlist } = useWishlist();
  const { addSearchTerm } = useSearch();
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const webBp = !isWeb ? 'mobile' : width < 720 ? 'narrow' : width < 1100 ? 'medium' : 'wide';

  // ✅ Tek kaynak: tüm web layout aynı container genişliğini kullansın
  const containerMaxWidth =
    !isWeb ? undefined : webBp === 'wide' ? 1200 : webBp === 'medium' ? 1040 : 900;

  const headerIconSize = isWeb ? 20 : 18;
  const headerIconSizeBig = isWeb ? 22 : 20;

  // Offline
  const isOffline = !isConnected || isInternetReachable === false;

  // Refs to prevent double fetching and handle race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0); // Unique ID for each fetch to handle race conditions

  // Grid mode: 1 / 2 / 3
  const [gridMode, setGridMode] = useState<1 | 2 | 3>(2);
  const numColumns = gridMode;
  const gridTouchedRef = useRef(false);

  useEffect(() => {
    if (!isWeb) return;
    if (gridTouchedRef.current) return;

    const next: 1 | 2 | 3 = width < 720 ? 1 : width < 1100 ? 2 : 3;
    if (gridMode !== next) setGridMode(next);
  }, [isWeb, width, gridMode]);

  // Multi-select mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search / Sort / Filter
  const [searchQuery, setSearchQuery] = useState((route.params as any)?.search ?? '');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState((route.params as any)?.search ?? '');
  const [selectedCategory, setSelectedCategory] = useState((route.params as any)?.category ?? 'All');
  const [sortBy, setSortBy] = useState('name,asc');
  const [sortLoaded, setSortLoaded] = useState(false);

  // ✨ NEW: Global stats from backend
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

  const filteredProducts = apiProducts;

  const loadSortPreference = useCallback(async () => {
    try {
      const storedSort = await AsyncStorage.getItem(SORT_STORAGE_KEY);
      if (storedSort) setSortBy(storedSort);
    } finally {
      setSortLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSortPreference();
  }, [loadSortPreference]);

  // ✨ NEW: Fetch global stats from backend (updates on filter changes)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getGlobalStats({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: submittedSearchQuery?.trim() || undefined,
        });
        setGlobalStats(stats);
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };
    fetchStats();
  }, [selectedCategory, submittedSearchQuery]);

  const toggleGridMode = () => {
    gridTouchedRef.current = true;
    setGridMode(prev => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleAddSelectedToWishlist = () => {
    const selectedProducts = filteredProducts.filter(p => {
      const id = String((p as any)?.id ?? '');
      return selectedItems.has(id) && !isInWishlist(id);
    });
    
    if (selectedProducts.length === 0) {
      handleCancelSelection();
      return;
    }

    // Prevent UI freeze by wrapping in requestAnimationFrame
    requestAnimationFrame(() => {
      addMultipleToWishlist(selectedProducts.map(p => ({
        id: String((p as any).id),
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        categories: p.categories,
        averageRating: p.averageRating,
      })) as any);
      handleCancelSelection();
    });
  };

  const handleCardLongPress = (product: ApiProduct) => {
    if (Platform.OS === 'android') return; // Disable long-press selection on Android

    const id = String((product as any)?.id ?? '');
    if (!id) return;
    setIsSelectionMode(true);
    setSelectedItems(prev => new Set(prev).add(id));
  };

  const handleCardPress = (product: ApiProduct) => {
    const id = String((product as any)?.id ?? '');
    if (!id) return;

    if (isSelectionMode) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (next.size === 0) setIsSelectionMode(false);
        return next;
      });
      return;
    }

    navigation.navigate('ProductDetails', { productId: (product as any)?.id });
  };

  // ✨ Improved fetchProducts with race condition protection
  const fetchProducts = useCallback(
    async (page: number, append: boolean, searchOverride?: string, categoryOverride?: string, sortOverride?: string) => {
      if (!sortLoaded) return;

      // Use override values or current state
      const effectiveSearch = searchOverride !== undefined ? searchOverride : submittedSearchQuery;
      const effectiveCategory = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const effectiveSort = sortOverride !== undefined ? sortOverride : sortBy;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Increment fetch ID to track this specific request
      fetchIdRef.current += 1;
      const currentFetchId = fetchIdRef.current;

      console.log(`[Search] Fetching with: search="${effectiveSearch}", category="${effectiveCategory}", sort="${effectiveSort}", page=${page}`);

      try {
        if (page === 0) setLoading(true);
        else setLoadingMore(true);

        setError(null);

        if (isOffline) {
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const res = await getProducts({
          page,
          size: 20,
          category: effectiveCategory === 'All' ? undefined : effectiveCategory,
          search: effectiveSearch?.trim() ? effectiveSearch.trim() : undefined,
          sort: effectiveSort,
        });

        // Check if this is still the latest request (race condition protection)
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Search] Ignoring stale response for fetchId=${currentFetchId}, current=${fetchIdRef.current}`);
          return;
        }

        const items = (res as any)?.content ?? (res as any)?.items ?? [];
        const totalPagesFromApi = (res as any)?.totalPages ?? 0;
        const totalElementsFromApi = (res as any)?.totalElements ?? 0;

        console.log(`[Search] Received ${items.length} items for search="${effectiveSearch}"`);

        setTotalPages(totalPagesFromApi);
        setTotalElements(totalElementsFromApi);
        setCurrentPage(page);
        setHasMore(page < totalPagesFromApi - 1);
        setApiProducts(prev => (append ? [...prev, ...items] : items));
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          console.log('[Search] Request aborted');
          return;
        }
        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err?.message ?? 'Failed to fetch products');
      } finally {
        // Only update loading state if this is the latest request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [sortLoaded, isOffline, submittedSearchQuery, selectedCategory, sortBy]
  );

  // Initial load and filter changes
  useEffect(() => {
    if (!sortLoaded) return;
    fetchProducts(0, false);
  }, [selectedCategory, submittedSearchQuery, sortBy, sortLoaded]);

  // ✨ Listen for review updates
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('reviewAdded', (event) => {
      console.log('Review added event received:', event);
      // Refresh the list silently (or with loading if preferred)
      fetchProducts(0, false);
      
      // Also refresh stats
      getGlobalStats({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: submittedSearchQuery?.trim() || undefined,
      }).then(setGlobalStats).catch(console.error);
    });

    return () => {
      subscription.remove();
    };
  }, [fetchProducts, selectedCategory, submittedSearchQuery]);

  useEffect(() => {
    const category = (route.params as any)?.category;
    const search = (route.params as any)?.search;
    if (category) setSelectedCategory(category);
    if (search !== undefined) {
      setSearchQuery(search);
      setSubmittedSearchQuery(search);
    }
  }, [route.params]);

  const loadMoreProducts = () => {
    if (loadingMore || loading || !hasMore) return;
    fetchProducts(currentPage + 1, true);
  };

  const stats = useMemo(() => {
    // ✨ Use global stats from backend if available
    if (globalStats) {
      return {
        productCount: globalStats.totalProducts,
        totalReviews: globalStats.totalReviews,
        avgRating: globalStats.averageRating,
      };
    }
    // Fallback: Calculate from loaded products (only used before backend responds)
    const productCount = totalElements;
    const totalReviews = apiProducts.reduce((sum, p) => sum + ((p as any)?.reviewCount || 0), 0);
    const avgRating = apiProducts.length > 0 
      ? apiProducts.reduce((sum, p) => sum + ((p as any)?.averageRating || 0), 0) / apiProducts.length
      : 0;
    return { productCount, totalReviews, avgRating };
  }, [globalStats, totalElements, apiProducts]);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearchQuery('');
    setSelectedCategory('All');
    setSortBy('name,asc');
    if (Platform.OS === 'web') navigation.setParams({ category: 'All', search: '' } as any);
  }, [navigation]);

  // ✨ Debounce search query & Auto-reset on clear
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Setting debounced search query:', searchQuery);
      
      if (searchQuery.trim().length === 0 && submittedSearchQuery.length > 0) {
        // ✨ Auto-reset when search is cleared
        handleReset();
      } else if (searchQuery.trim().length > 0) {
        // Optional: Auto-search while typing (if desired)
        // setSubmittedSearchQuery(searchQuery);
      }
      
      if (Platform.OS === 'web') {
        navigation.setParams({ 
            category: selectedCategory, 
            search: searchQuery 
        } as any);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [searchQuery, submittedSearchQuery, selectedCategory, navigation, handleReset]);

  const handleSearchSubmit = (search: string) => {
    if (search.trim().length > 0) {
      addSearchTerm(search);
      setSubmittedSearchQuery(search);
      if (Platform.OS === 'web') navigation.setParams({ search } as any);
    } else {
      handleReset();
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (Platform.OS === 'web') navigation.setParams({ category } as any);
  };

  const handleSortChange = async (sort: string) => {
    setSortBy(sort);
    try {
      await AsyncStorage.setItem(SORT_STORAGE_KEY, sort);
    } catch (error) {
      console.error('Failed to save sort preference:', error);
    }
  };

  const handleRetry = useCallback(async () => {
    const online = await checkConnection();
    if (online) {
      setError(null);
      fetchProducts(0, false);
    }
  }, [checkConnection, fetchProducts]);

  // ✨ ListHeaderComponent - Hero, Search, Filter - all scroll together with list
  const listHeaderContent = useMemo(() => (
    <>
      {/* Top Bar - Logo & Actions */}
      <View style={[isWeb && styles.webPageContainer, isWeb && { maxWidth: containerMaxWidth }]}>
        <View style={[styles.topBar, isWeb && styles.topBarWeb]}>
          <TouchableOpacity onPress={handleReset} style={styles.logoContainer}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.logoIcon}>
              <Ionicons name="star" size={16} color={colors.primaryForeground} />
            </LinearGradient>
            <Text style={[styles.logoText, { color: colors.foreground }]}>ProductReview</Text>
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                isWeb && styles.headerIconButtonWeb,
                { backgroundColor: colors.secondary },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons
                name={colorScheme === 'dark' ? 'sunny' : 'moon'}
                size={headerIconSize}
                color={colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridButton,
                isWeb && styles.headerIconButtonWeb,
                { backgroundColor: colors.secondary },
              ]}
              onPress={toggleGridMode}
              activeOpacity={0.8}
            >
              <Ionicons
                name={gridMode === 1 ? 'list' : gridMode === 2 ? 'grid-outline' : 'grid'}
                size={headerIconSize}
                color={colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                isWeb && styles.headerIconButtonWeb,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('Wishlist')}
              activeOpacity={0.8}
            >
              <Ionicons name="heart-outline" size={headerIconSizeBig} color={colors.foreground} />
              {wishlistCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.notificationButton,
                isWeb && styles.headerIconButtonWeb,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={headerIconSizeBig} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View
          style={[
            styles.heroSection,
            { backgroundColor: colors.secondary },
            isWeb && styles.heroSectionWeb,
            isWeb && {
              maxWidth: containerMaxWidth,
              paddingVertical: webBp === 'narrow' ? Spacing.xl : Spacing['2xl'],
            },
          ]}
        >
          <Text style={[styles.heroTitle, isWeb && styles.heroTitleWeb, { color: colors.foreground }]}>
            Find Products You'll <Text style={{ color: colors.primary }}>Love</Text>
          </Text>

          <View style={[styles.statsRow, isWeb && webBp === 'narrow' && styles.statsRowNarrow]}>
            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="star" size={18} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.avgRating.toFixed(1)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Rating</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="chatbubbles" size={18} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{String(stats.totalReviews)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reviews</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="cube" size={18} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{String(stats.productCount)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Products</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search Section */}
      <View
        style={[
          styles.searchSection,
          isWeb && styles.searchSectionWeb,
          isWeb && { maxWidth: containerMaxWidth },
        ]}
      >
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} onSearchSubmit={handleSearchSubmit} />
      </View>

      {/* Filter Section */}
      <View style={[
        styles.filterSection,
        isWeb && styles.filterSectionWeb,
        isWeb && { maxWidth: containerMaxWidth },
      ]}>
        <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
          Explore Products
        </Text>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>Sort by:</Text>
        </View>
        <SortFilter
          selectedSort={sortBy}
          onSortChange={handleSortChange}
        />
      </View>
    </>
  ), [
    isWeb, containerMaxWidth, webBp, colors, colorScheme, 
    handleReset, toggleTheme, toggleGridMode, gridMode,
    headerIconSize, headerIconSizeBig, wishlistCount, unreadCount,
    stats, searchQuery, setSearchQuery, handleSearchSubmit,
    selectedCategory, handleCategoryChange, sortBy, handleSortChange
  ]);

  useFocusEffect(
    useCallback(() => {
      return () => { };
    }, [])
  );

  const newToWishlistCount = useMemo(() => {
    let count = 0;
    selectedItems.forEach(id => {
      if (!isInWishlist(id)) count++;
    });
    return count;
  }, [selectedItems, isInWishlist]);

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          if (isSelectionMode && selectedItems.size > 0) handleCancelSelection();
        }}
      >
        <View style={{ flex: 1 }}>
          {isOffline && <OfflineBanner onRetry={handleRetry} />}

          <FlatList
            data={loading || error ? [] : filteredProducts}
            key={numColumns}
            numColumns={numColumns}
            columnWrapperStyle={
              numColumns > 1 ? styles.columnWrap : undefined
            }
            removeClippedSubviews={false}
            keyExtractor={(item: any) => String(item?.id ?? '')}
            contentContainerStyle={[
              styles.listContent,
              isWeb && styles.webListContent,
              isWeb && { maxWidth: containerMaxWidth },
              !isWeb && { paddingHorizontal: Spacing.lg },
            ]}
            ListHeaderComponent={listHeaderContent}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading products...</Text>
                </View>
              ) : error && !isOffline ? (
                // Only show error if NOT offline (offline banner handles that case)
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, marginLeft: Spacing.sm, flex: 1 }}>{error}</Text>
                  <TouchableOpacity onPress={handleRetry} style={styles.retryTextButton}>
                    <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : isOffline ? (
                // Offline: show minimal message, banner handles the rest
                <View style={styles.offlineContainer}>
                  <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>
                    Waiting for connection...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                    <Ionicons name="search-outline" size={44} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                    Try adjusting your search or filters to find what you're looking for.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                    onPress={handleReset}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Clear all filters</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            renderItem={({ item, index }) => {
              const isGrid = numColumns > 1;
              const gapSize = Platform.OS === 'android' ? Spacing.md : Spacing.lg;
              
              return (
                <View
                  style={[
                    isGrid && {
                      width: `${100 / numColumns}%`,
                      paddingRight: index % numColumns === numColumns - 1 ? 0 : gapSize / 2,
                      paddingLeft: index % numColumns === 0 ? 0 : gapSize / 2,
                      marginBottom: Spacing.lg,
                      flexGrow: 0,
                      flexShrink: 0,
                    },
                    !isGrid && {
                      width: '100%',
                      marginBottom: Spacing.lg,
                    },
                  ]}
                  collapsable={false}
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
              );
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            maxToRenderPerBatch={Platform.OS === 'android' ? 10 : 15}
            updateCellsBatchingPeriod={Platform.OS === 'android' ? 50 : 30}
            initialNumToRender={10}
            ListFooterComponent={
              !loading && !error && filteredProducts.length > 0 ? (
                <View style={styles.footerWrap}>
                  <LoadMoreCard
                    onPress={loadMoreProducts}
                    loading={loadingMore}
                    hasMore={hasMore}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                </View>
              ) : null
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (hasMore && !loadingMore && !loading && !error) loadMoreProducts();
            }}
          />

          {isSelectionMode && selectedItems.size > 0 && (
            <View style={[styles.floatingBar, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[
                  styles.floatingButton, 
                  { backgroundColor: newToWishlistCount > 0 ? colors.primary : colors.muted }
                ]}
                onPress={handleAddSelectedToWishlist}
                activeOpacity={0.85}
                disabled={newToWishlistCount === 0}
              >
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={[styles.floatingButtonText, { color: '#fff' }]}>
                  {newToWishlistCount > 0 
                    ? `Add to Wishlist (${newToWishlistCount})`
                    : 'Already in Wishlist'
                  }
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
  webPageContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },

  topBarWeb: {
    paddingHorizontal: 0,
  },

  heroSectionWeb: {
    marginHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
  },

  statsRowNarrow: { gap: Spacing.xl },

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

  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  themeButton: {
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gridButton: {
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationButton: {
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconButtonWeb: {
    width: 40,
    height: 40,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  heroTitleWeb: {
    fontSize: FontSize.xl,
  },

  heroSubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  heroSubtitleWeb: {
    fontSize: FontSize.base,
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
  statLabel: { fontSize: FontSize.sm },

  // ✅ SearchBar daha “orantılı”: biraz daha yüksek + full-width container
  searchSection: {
    paddingVertical: Spacing.md,
    zIndex: 9999,
    elevation: 20,
    paddingHorizontal: Spacing.lg,
  },
  searchSectionWeb: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },

  // Filter Section Styles
  filterSection: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterSectionWeb: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  filterSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sortLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },

  webListContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },

  gridItem: {
    flex: 1,
    minWidth: Platform.OS !== 'android' ? 0 : undefined,
    marginBottom: Spacing.lg,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },

  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },

  retryTextButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  // ✅ Footer flows naturally as part of list content
  footerWrap: {
    width: '100%',
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },

  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  floatingButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  columnWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  
  // ✅ Offline state (minimal - banner handles the main message)
  offlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    marginTop: Spacing['3xl'],
  },
  offlineText: {
    fontSize: FontSize.base,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    marginTop: Spacing['5xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});