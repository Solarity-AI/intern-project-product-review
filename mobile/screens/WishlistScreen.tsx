// WishlistScreen - Display user's favorite products
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { StarRating } from '../components/StarRating';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { RootStackParamList } from '../types';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

export const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const numColumns =
    width >= 1200 ? 3 :
    width >= 900 ? 2 : 1;

  const stats = useMemo(() => {
    const totalPrice = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
    const avgRating = wishlist.length > 0
      ? wishlist.reduce((sum, item) => sum + (item.averageRating || 0), 0) / wishlist.length
      : 0;

    return {
      count: wishlist.length,
      totalPrice,
      avgRating,
    };
  }, [wishlist]);

  const handleProductPress = (item: WishlistItem) => {
    navigation.navigate('ProductDetails', {
      productId: item.id,
      imageUrl: item.imageUrl,
      name: item.name,
    } as any);
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          width: numColumns > 1 ? `${100 / numColumns - 2}%` : '100%',
        },
      ]}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
          </View>
        )}

        {/* Remove button */}
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.destructive }]}
          onPress={() => removeFromWishlist(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={2} style={[styles.name, { color: colors.foreground }]}>
          {item.name}
        </Text>

        {item.averageRating !== undefined && (
          <StarRating rating={item.averageRating} size="sm" />
        )}

        {item.price !== undefined && (
          <Text style={[styles.price, { color: colors.primary }]}>
            ${item.price.toFixed(2)}
          </Text>
        )}

        {item.category && (
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {item.category}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name="heart-outline" size={64} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your wishlist is empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Start adding your favorite products to see them here
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ProductList')}
        activeOpacity={0.8}
      >
        <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
          Browse Products
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Stats */}
      {wishlist.length > 0 && (
        <View style={[styles.statsCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="heart" size={20} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {stats.count}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Items
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="star" size={20} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {stats.avgRating.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Avg Rating
                </Text>
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
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Total
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Wishlist</Text>
            {wishlist.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>
        </View>

        {wishlist.length > 0 && (
          <TouchableOpacity onPress={clearWishlist} activeOpacity={0.7}>
            <Text style={[styles.clearAll, { color: colors.destructive }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={wishlist}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderWishlistItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.webMaxWidth,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  clearAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  statsCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
  },

  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },

  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  category: {
    fontSize: FontSize.xs,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.soft,
  },
  emptyButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  webMaxWidth: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
