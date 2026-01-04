import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { StarRating } from './StarRating';
import { RootStackParamList } from '../types';
import { Colors, Spacing, BorderRadius, Shadow, FontWeight } from '../constants/theme';
import { ApiProduct } from '../services/api';

interface ProductCardProps {
  product: ApiProduct;
}

function imageForCategory(category?: string) {
  const c = (category ?? '').toLowerCase();
  if (c.includes('audio')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  if (c.includes('smart') || c.includes('phone') || c.includes('mobile')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80';
  if (c.includes('camera') || c.includes('photo')) return 'https://images.unsplash.com/photo-1519183071298-a2962be96cdb?w=800&q=80';
  if (c.includes('watch') || c.includes('wear')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30e?w=800&q=80';
  if (c.includes('laptop') || c.includes('computer')) return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80';
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;

  const imageUri = useMemo(() => {
    const direct =
      (product as any)?.imageUrl ||
      (product as any)?.image ||
      (product as any)?.thumbnailUrl;

    if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();
    return imageForCategory((product as any)?.category);
  }, [product]);

  const reviewCount = (product as any)?.reviewCount ?? (product as any)?.totalReviews ?? 0;
  const avgRating = (product as any)?.averageRating ?? 0;

  const handlePress = () => {
    // ✅ MIN FIX: imageUrl + name'i route param ile gönderiyoruz
    navigation.navigate(
      'ProductDetails',
      {
        productId: String((product as any)?.id ?? ''),
        imageUrl: imageUri,
        name: (product as any)?.name ?? null,
      } as any // RootStackParamList dar tanımlıysa TS hata vermesin diye
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        {!!(product as any)?.category && (
          <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryText, { color: colors.foreground }]}>
              {(product as any)?.category}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>
          {(product as any)?.name ?? 'Product'}
        </Text>

        <View style={styles.ratingRow}>
          <StarRating rating={avgRating} size="sm" />
          <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
            ({reviewCount})
          </Text>
        </View>

        <Text style={[styles.price, { color: colors.foreground }]}>
          {typeof (product as any)?.price === 'number'
            ? `$${(product as any)?.price.toFixed(2)}`
            : (product as any)?.price ?? ''}
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
    ...Shadow.soft, // ✅ SYNTAX FIX (senin dosyada .Shadow.soft gibi typo vardı)
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  categoryBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    maxWidth: '80%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadow.soft, // ✅ SYNTAX FIX
  },

  categoryText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },

  content: {
    padding: Spacing.md,
    gap: 6,
  },

  name: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  reviewCount: {
    fontSize: 12,
  },

  price: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
});
