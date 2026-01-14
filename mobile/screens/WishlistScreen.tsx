import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectableWishlistCard } from '../components/SelectableWishlistCard';

import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

import { RootStackParamList } from '../types';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type WishlistNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Wishlist'>;

const GRID_STORAGE_KEY = 'wishlist_grid_mode';

export const WishlistScreen = () => {
  const navigation = useNavigation<WishlistNavigationProp>();
  const { colors, colorScheme, toggleTheme } = useTheme();
  const { wishlist, removeFromWishlist, clearWishlist, addMultipleToWishlist } = useWishlist();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const webBp = !isWeb ? 'mobile' : width < 720 ? 'narrow' : width < 1100 ? 'medium' : 'wide';

  // Web’de daha büyük ikon + buton
  const headerIconSize = isWeb ? (webBp === 'wide' ? 26 : 24) : 20;
  const headerIconSizeBig = isWeb ? (webBp === 'wide' ? 28 : 26) : 22;

  // Grid mode: 1 / 2 / 4
  const [gridMode, setGridMode] = useState<1 | 2 | 4>(2);
  const numColumns = gridMode;

  const gridTouchedRef = useRef(false);

  // Web auto-grid (kullanıcı grid toggle’a basarsa auto kapanır)
  useEffect(() => {
    if (!isWeb) return;
    if (gridTouchedRef.current) return;

    const next: 1 | 2 | 4 = width < 720 ? 1 : width < 1100 ? 2 : 4;
    if (gridMode !== next) setGridMode(next);
  }, [isWeb, width, gridMode]);

  // Grid preference load/save (mobilde anlamlı, webde de bozmuyor)
  const loadGridPreference = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(GRID_STORAGE_KEY);
      const parsed = stored ? (Number(stored) as 1 | 2 | 4) : null;
      if (parsed === 1 || parsed === 2 || parsed === 4) {
        setGridMode(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  const saveGridPreference = useCallback(async (value: 1 | 2 | 4) => {
    try {
      await AsyncStorage.setItem(GRID_STORAGE_KEY, String(value));
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    loadGridPreference();
  }, [loadGridPreference]);

  const toggleGridMode = () => {
    gridTouchedRef.current = true;
    setGridMode(prev => {
      const next = prev === 1 ? 2 : prev === 2 ? 4 : 1;
      saveGridPreference(next);
      return next;
    });
  };

  // Multi-select mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleCardLongPress = (item: WishlistItem) => {
    const id = String((item as any)?.id ?? '');
    if (!id) return;

    setIsSelectionMode(true);
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleCardPress = (item: WishlistItem) => {
    const id = String((item as any)?.id ?? '');
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

    navigation.navigate('ProductDetails', { productId: (item as any)?.id });
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach(id => removeFromWishlist(id));
    handleCancelSelection();
  };

  const stats = useMemo(() => {
    const itemCount = wishlist.length;
    const totalPrice = wishlist.reduce((sum, item: any) => sum + (Number(item?.price) || 0), 0);
    return { itemCount, totalPrice };
  }, [wishlist]);

  const renderWishlistItem = ({ item, index }: { item: WishlistItem; index: number }) => {
    const id = String((item as any)?.id ?? '');
    const selected = selectedItems.has(id);

    // ✅ Android 4-col kayma fix: width + item padding ile kontrol

    const isGrid = numColumns > 1;
    const colIndex = isGrid ? index % numColumns : 0;

    return (
      <View
        style={[
          isGrid ? styles.gridItemWrapper : styles.listItemWrapper,
          isGrid && {
            width: `${100 / numColumns}%`,
            maxWidth: `${100 / numColumns}%`,
          },
          // ✅ spacing: sadece sağa margin ver, satırın son item’ında verme
          isGrid && {
            paddingHorizontal: 0, // ✅ gridItemWrapper padding’ini ez
            marginRight: colIndex === numColumns - 1 ? 0 : Spacing.sm,
            marginBottom: Spacing.sm,
          },
        ]}
      >

        <SelectableWishlistCard
          item={item}
          numColumns={numColumns}
          isSelectionMode={isSelectionMode}
          isSelected={selected}
          onPress={handleCardPress}
          onLongPress={handleCardLongPress}
          onRemove={(id) => removeFromWishlist(id)}
        />
      </View>
    );
  };

  const emptyState = (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name="heart-outline" size={44} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your wishlist is empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Save products you love and find them here later.
      </Text>

      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ProductList')}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={18} color={colors.primaryForeground} />
        <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Browse products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          if (isSelectionMode && selectedItems.size > 0) handleCancelSelection();
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={isWeb ? styles.webPageContainer : undefined}>
            <View style={[styles.header, { backgroundColor: colors.background }, isWeb && styles.headerWeb]}>
              <TouchableOpacity
                style={[styles.brand, isWeb && styles.brandWeb]}
                onPress={() => navigation.navigate('ProductList')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.brandIcon}>
                  <Ionicons name="star" size={16} color={colors.primaryForeground} />
                </LinearGradient>
                <Text style={[styles.brandText, { color: colors.foreground }]}>ProductReview</Text>
              </TouchableOpacity>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isWeb && styles.headerButtonWeb,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={toggleTheme}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={colorScheme === 'dark' ? 'sunny' : 'moon'}
                    size={headerIconSize}
                    color={colors.foreground}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isWeb && styles.headerButtonWeb,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={toggleGridMode}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={gridMode === 1 ? 'list' : gridMode === 2 ? 'grid-outline' : 'grid'}
                    size={headerIconSize}
                    color={colors.foreground}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isWeb && styles.headerButtonWeb,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={() => clearWishlist()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="trash-outline" size={headerIconSizeBig} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            {wishlist.length > 0 && (
              <View style={[styles.statsSection, { backgroundColor: colors.secondary }, isWeb && styles.statsSectionWeb]}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                      <Ionicons name="cube" size={20} color={colors.primaryForeground} />
                    </LinearGradient>
                    <View>
                      <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.itemCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Items</Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                      <Ionicons name="cash" size={20} color={colors.primaryForeground} />
                    </LinearGradient>
                    <View>
                      <Text style={[styles.statValue, { color: colors.foreground }]}>
                        ${stats.totalPrice.toFixed(0)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          {wishlist === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading wishlist...</Text>
            </View>
          ) : wishlist.length === 0 ? (
            emptyState
          ) : (
            <FlatList
              data={wishlist}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item: any) => String(item?.id ?? '')}
              renderItem={renderWishlistItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.listContent,
                isWeb && styles.webListContent,
              ]}
              // ✅ Android 4-col kayma fix: gap yerine space-between
              columnWrapperStyle={
                numColumns > 1
                  ? [
                    styles.columnWrapper,
                    { justifyContent: 'flex-start' }, // ✅ space-between KALKSIN
                    isWeb && styles.columnWrapperWeb,
                  ]
                  : undefined
              }

            />
          )}

          {/* Floating bottom bar for selection mode */}
          {isSelectionMode && selectedItems.size > 0 && (
            <View style={[styles.floatingBar, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.floatingButton, { backgroundColor: colors.destructive }]}
                onPress={handleRemoveSelected}
                activeOpacity={0.9}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={[styles.floatingButtonText, { color: '#fff' }]}>
                  Remove ({selectedItems.size})
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
  // ✅ Web container (full width + split view)
  webPageContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },

  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerWeb: {
    paddingHorizontal: 0, // webPageContainer handles padding
  },

  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  brandWeb: {
    paddingVertical: 4,
  },

  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonWeb: {
    width: 46,
    height: 46,
  },

  statsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },

  statsSectionWeb: {
    marginHorizontal: 0,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  listContent: {
    paddingBottom: Spacing['5xl'] + Spacing.xl,
  },

  webListContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'] + Spacing.xl,
  },

  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-start', // ✅ space-between değil
  },


  columnWrapperWeb: {
    paddingHorizontal: 0, // webListContent already has padding
  },

  // ✅ item wrapper: gap yerine padding (Android daha stabil)
  gridItemWrapper: {
    paddingVertical: Spacing.sm, // yatay padding'i kaldır
  },



  gridItemPad: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  listItemWrapper: {
    paddingVertical: Spacing.sm,
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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },

  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },

  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  emptyButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
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
});
