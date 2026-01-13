import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StarRating } from './StarRating';
import { RootStackParamList } from '../types';
import { Spacing, BorderRadius, Shadow, FontWeight } from '../constants/theme';
import { ApiProduct } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';

interface SelectableProductCardProps {
  product: ApiProduct;
  numColumns?: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: (product: ApiProduct) => void;
  onLongPress: (product: ApiProduct) => void;
}

function imageForCategory(categories?: string[]) {
  const c = (categories && categories.length > 0 ? categories[0] : '').toLowerCase();
  if (c.includes('audio')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  if (c.includes('smart') || c.includes('phone') || c.includes('mobile')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80';
  if (c.includes('camera') || c.includes('photo')) return 'https://images.unsplash.com/photo-1519183071298-a2962be96cdb?w=800&q=80';
  if (c.includes('watch') || c.includes('wear')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30e?w=800&q=80';
  if (c.includes('laptop') || c.includes('computer')) return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80';
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
}

export const SelectableProductCard: React.FC<SelectableProductCardProps> = ({
  product,
  numColumns = 2,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
}) => {
  const { colors, colorScheme } = useTheme();

  const imageUri = useMemo(() => {
    const direct = product.imageUrl;
    if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();
    return imageForCategory(product.categories);
  }, [product]);

  const reviewCount = product.reviewCount ?? 0;
  const avgRating = product.averageRating ?? 0;

  const { isInWishlist, toggleWishlist } = useWishlist();
  const productId = String(product.id ?? '');
  const inWishlist = isInWishlist(productId);

  // Wishlist button styling - theme-aware
  const wishlistButtonBg = inWishlist
    ? colors.primary
    : colorScheme === 'dark'
      ? 'rgba(28, 25, 23, 0.9)'
      : 'rgba(255, 255, 255, 0.9)';
  const wishlistIconColor = inWishlist ? '#fff' : colors.foreground;
  const showWishlistButton = numColumns < 4;

  const handleWishlistToggle = (e: any) => {
    e.stopPropagation();
    toggleWishlist({
      id: productId,
      name: product.name ?? 'Product',
      price: product.price,
      imageUrl: imageUri,
      categories: product.categories,
      averageRating: avgRating,
    } as any);
  };

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelectionMode) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -2,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 2,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      shakeAnim.setValue(0);
    }
  }, [isSelectionMode, shakeAnim]);

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-2deg', '2deg'],
  });

  // ✨ Fallback logic for category display
  let displayCategory = 'Uncategorized';
  if (product.categories && product.categories.length > 0) {
    displayCategory = product.categories[0];
  } else if ((product as any).category) {
    displayCategory = (product as any).category;
  }

  return (
    <Animated.View
      style={
        isSelectionMode
          ? { transform: [{ rotate: rotateInterpolate }] }
          : undefined
      }
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.container,
          { backgroundColor: colors.card },
          isSelectionMode && styles.cardSelectionMode,
          isSelected && [styles.cardSelected, { borderColor: colors.primary }],
        ]}
        onPress={() => onPress(product)}
        onLongPress={() => onLongPress(product)}
        delayLongPress={2250}
      >
        <View
          style={[
            styles.imageContainer,
            numColumns === 4 && styles.imageContainerCompact,
          ]}
        >
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />


          {/* Wishlist button (normal mode) */}
          {!isSelectionMode && showWishlistButton && (
            <TouchableOpacity
              style={[styles.wishlistButton, { backgroundColor: wishlistButtonBg, zIndex: 2 }]}
              onPress={handleWishlistToggle}
              activeOpacity={0.8}
            >
              <Ionicons
                name={inWishlist ? 'heart' : 'heart-outline'}
                size={20}
                color={wishlistIconColor}
              />
            </TouchableOpacity>
          )}
          {/* Selection indicator */}
          {isSelectionMode && (
            <View
              style={[
                styles.selectionIndicator,
                {
                  backgroundColor: isSelected ? colors.primary : 'rgba(255,255,255,0.9)',
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          )}

          <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
            <Text
              style={[
                styles.categoryText,
                { color: colors.foreground },
                numColumns === 4 && styles.categoryTextCompact,
              ]}
            >
              {displayCategory}
            </Text>
          </View>
        </View>

        <View style={[styles.content, numColumns === 4 && styles.contentCompact]}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              { color: colors.foreground },
              numColumns === 4 && styles.nameCompact,
            ]}
          >
            {product.name ?? 'Product'}
          </Text>

          <View style={styles.ratingRow}>
            <StarRating rating={avgRating} size="sm" compact={numColumns === 4} />
            <Text
              style={[
                styles.reviewCount,
                { color: colors.mutedForeground },
                numColumns === 4 && styles.reviewCountCompact,
              ]}
            >
              ({reviewCount})
            </Text>
          </View>

          <Text
            style={[
              styles.price,
              { color: colors.foreground },
              numColumns === 4 && styles.priceCompact,
            ]}
          >
            {`$${product.price.toFixed(2)}`}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  cardSelectionMode: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardSelected: {
    borderWidth: 2,
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
  },
  imageContainerCompact: {
    aspectRatio: 1,
    maxHeight: 150,
  },

  image: {
    width: '100%',
    height: '100%',
  },


  wishlistButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  categoryBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    maxWidth: '80%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadow.soft,
    zIndex: 1, // ✨ Added zIndex
  },

  categoryText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  categoryTextCompact: {
    fontSize: 10,
  },

  content: {
    padding: Spacing.md,
    gap: 6,
  },
  contentCompact: {
    padding: Spacing.sm,
    gap: 4,
  },

  name: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  nameCompact: {
    fontSize: 11,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  reviewCount: {
    fontSize: 12,
  },
  reviewCountCompact: {
    fontSize: 10,
  },

  price: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  priceCompact: {
    fontSize: 12,
  },
});
