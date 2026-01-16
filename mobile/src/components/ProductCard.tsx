import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { StarRating } from './StarRating';
import { RootStackParamList } from '../types';
import { Spacing, BorderRadius, Shadow, FontWeight } from '../constants/theme';
import { ApiProduct } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: ApiProduct;
  numColumns?: number;
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

export const ProductCard: React.FC<ProductCardProps> = ({ product, numColumns = 2 }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, colorScheme } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productId = String(product.id ?? '');
  const inWishlist = isInWishlist(productId);

  const imageUri = useMemo(() => {
    const direct = product.imageUrl;
    if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();
    return imageForCategory(product.categories);
  }, [product]);

  const reviewCount = product.reviewCount ?? 0;
  const avgRating = product.averageRating ?? 0;

  const handlePress = () => {
    navigation.navigate(
      'ProductDetails',
      {
        productId: String(product.id ?? ''),
        imageUrl: imageUri,
        name: product.name ?? null,
      } as any
    );
  };

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

  const wishlistButtonBg = inWishlist 
    ? colors.primary 
    : colorScheme === 'dark' 
      ? 'rgba(28, 25, 23, 0.9)' 
      : 'rgba(255, 255, 255, 0.9)';
  
  const wishlistIconColor = inWishlist 
    ? '#fff' 
    : colors.foreground;

  const showWishlistButton = numColumns < 4;

  let displayCategory = 'Uncategorized';
  if (product.categories && product.categories.length > 0) {
    displayCategory = product.categories[0];
  } else if ((product as any).category) {
    displayCategory = (product as any).category;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
    >
      <View style={[
        styles.imageContainer,
        numColumns >= 3 && styles.imageContainerCompact,
        // ✨ iOS Single Column: Larger Image
        (Platform.OS === 'ios' && numColumns === 1) && styles.imageContainerLarge
      ]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        {showWishlistButton && (
          <TouchableOpacity
            style={[
              styles.wishlistButton, 
              { backgroundColor: wishlistButtonBg, zIndex: 2 },
              numColumns >= 3 && styles.wishlistButtonCompact
            ]}
            onPress={handleWishlistToggle}
            activeOpacity={0.8}
          >
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={numColumns >= 3 ? 16 : 20}
              color={wishlistIconColor}
            />
          </TouchableOpacity>
        )}

        <View style={[
          styles.categoryBadge, 
          { backgroundColor: colors.secondary },
          numColumns >= 3 && styles.categoryBadgeCompact
        ]}>
          <Text style={[
            styles.categoryText, 
            { color: colors.foreground },
            numColumns >= 3 && styles.categoryTextCompact
          ]}>
            {displayCategory}
          </Text>
        </View>
      </View>

      <View style={[
        styles.content,
        numColumns >= 3 && styles.contentCompact
      ]}>
        <Text numberOfLines={1} style={[
          styles.name, 
          { color: colors.foreground },
          numColumns >= 3 && styles.nameCompact
        ]}>
          {product.name ?? 'Product'}
        </Text>

        <View style={[styles.ratingRow, numColumns >= 3 && styles.ratingRowCompact]}>
          <StarRating rating={avgRating} size="sm" compact={numColumns >= 3} />
          <Text style={[
            styles.reviewCount, 
            { color: colors.mutedForeground },
            numColumns >= 3 && styles.reviewCountCompact
          ]}>
            ({reviewCount})
          </Text>
        </View>

        <Text style={[
          styles.price, 
          { color: colors.foreground },
          numColumns >= 3 && styles.priceCompact
        ]}>
          {`$${product.price.toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
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
  // ✨ Larger image for single column
  imageContainerLarge: {
    aspectRatio: 4 / 3, // More square-ish
    maxHeight: 300,
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
  wishlistButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    top: Spacing.sm,
    right: Spacing.sm,
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
    zIndex: 1,
  },
  categoryBadgeCompact: {
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  categoryTextCompact: {
    fontSize: 9,
  },

  content: {
    padding: Spacing.md,
    gap: 6,
  },
  contentCompact: {
    padding: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },

  name: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  nameCompact: {
    fontSize: 10,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingRowCompact: {
    gap: 2,
  },

  reviewCount: {
    fontSize: 12,
  },
  reviewCountCompact: {
    fontSize: 9,
  },

  price: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  priceCompact: {
    fontSize: 11,
  },
});