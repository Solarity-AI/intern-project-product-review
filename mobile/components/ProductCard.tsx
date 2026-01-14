import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ProductLike = {
  id?: string | number;
  name?: string;
  title?: string;
  price?: number | string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
};

type Props = {
  product: ProductLike;
  onPress?: () => void;

  /**
   * ProductList'ten geliyor: 1 / 2 / 4
   * 4'lü grid’de metin/pill otomatik küçülür + kırpılır.
   */
  numColumns?: 1 | 2 | 4;

  /**
   * Bazı yerlerde kartı farklı spacing ile kullanıyorsan override.
   */
  style?: ViewStyle;
};

const getSafeString = (v: any) => (v === null || v === undefined ? '' : String(v));

export const ProductCard = memo(({ product, onPress, numColumns = 2, style }: Props) => {
  const { colors } = useTheme();

  const isWeb = Platform.OS === 'web';

  const title = getSafeString(product?.name ?? product?.title ?? 'Untitled');
  const category = getSafeString(product?.category ?? '');
  const img = getSafeString(product?.imageUrl ?? product?.image ?? product?.thumbnail ?? '');
  const rating = typeof product?.rating === 'number' ? product.rating : Number(product?.rating ?? 0);
  const reviewCount =
    typeof product?.reviewCount === 'number' ? product.reviewCount : Number(product?.reviewCount ?? 0);

  const priceText = useMemo(() => {
    const p = product?.price;
    if (p === null || p === undefined || p === '') return '';
    const n = typeof p === 'number' ? p : Number(p);
    if (!Number.isFinite(n)) return getSafeString(p);
    return `$${n.toFixed(2)}`;
  }, [product?.price]);

  const density = useMemo(() => {
    /**
     * 4 columns: en yoğun layout -> her şeyi biraz küçült
     * 2 columns: normal
     * 1 column: daha rahat
     */
    if (numColumns === 4) return 'dense';
    if (numColumns === 1) return 'relaxed';
    return 'normal';
  }, [numColumns]);

  const s = useMemo(() => {
    const cardRadius = BorderRadius.xl;
    const imageHeight = density === 'dense' ? 72 : density === 'relaxed' ? 170 : 120;

    const pad = density === 'dense' ? Spacing.sm : Spacing.md;

    const titleSize =
      density === 'dense'
        ? Math.max(11, FontSize.sm - 1)
        : density === 'relaxed'
          ? FontSize.lg
          : FontSize.base;

    const metaSize =
      density === 'dense'
        ? Math.max(10, FontSize.xs ?? 10)
        : density === 'relaxed'
          ? FontSize.base
          : FontSize.sm;

    const priceSize =
      density === 'dense'
        ? Math.max(11, FontSize.sm - 1)
        : density === 'relaxed'
          ? FontSize.lg
          : FontSize.base;

    const pillFont =
      density === 'dense'
        ? Math.max(9, (FontSize.xs ?? 10) - 1)
        : (FontSize.xs ?? 10);

    const pillPadV = density === 'dense' ? 3 : 4;
    const pillPadH = density === 'dense' ? 7 : 8;

    return {
      cardRadius,
      imageHeight,
      pad,
      titleSize,
      metaSize,
      priceSize,
      pillFont,
      pillPadV,
      pillPadH,
      titleLines: density === 'dense' ? 1 : 2,
    };
  }, [density]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: s.cardRadius,
        },
        style,
      ]}
    >
      {/* IMAGE */}
      <View
        style={[
          styles.imageWrap,
          {
            height: s.imageHeight,
            borderTopLeftRadius: s.cardRadius,
            borderTopRightRadius: s.cardRadius,
            backgroundColor: colors.muted,
          },
        ]}
      >
        {img ? (
          <Image
            source={{ uri: img }}
            style={[
              styles.image as ImageStyle,
              {
                borderTopLeftRadius: s.cardRadius,
                borderTopRightRadius: s.cardRadius,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={22} color={colors.mutedForeground} />
            <Text style={[styles.noImageText, { color: colors.mutedForeground }]}>No image</Text>
          </View>
        )}

        {/* Category pill */}
        {!!category && (
          <View
            style={[
              styles.pill,
              {
                backgroundColor: isWeb ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.5)',
                paddingVertical: s.pillPadV,
                paddingHorizontal: s.pillPadH,
                maxWidth: '78%',
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  fontSize: s.pillFont,
                  color: '#fff',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category}
            </Text>
          </View>
        )}
      </View>

      {/* BODY */}
      <View style={[styles.body, { padding: s.pad }]}>
        <Text
          style={[
            styles.title,
            { color: colors.foreground, fontSize: s.titleSize },
          ]}
          numberOfLines={s.titleLines}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          {renderStars(rating, (colors as any).warning ?? '#f5c542')}
          <Text style={[styles.reviewCount, { color: colors.mutedForeground, fontSize: s.metaSize }]}>
            {reviewCount > 0 ? `(${reviewCount})` : ''}
          </Text>
        </View>

        {!!priceText && (
          <Text style={[styles.price, { color: colors.foreground, fontSize: s.priceSize }]}>
            {priceText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

function renderStars(value: number, color: string) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  const stars = [];
  for (let i = 0; i < 5; i++) {
    const name =
      i < full ? 'star' : i === full && half ? 'star-half' : 'star-outline';
    stars.push(
      <Ionicons
        key={i}
        name={name as any}
        size={12}
        color={color}
        style={{ marginRight: 1 }}
      />
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
  },

  imageWrap: {
    width: '100%',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  noImageText: {
    fontSize: 11,
    fontWeight: '600',
  },

  pill: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: BorderRadius.full,
  },

  pillText: {
    fontWeight: '700',
  },

  body: {
    gap: 6,
  },

  title: {
    fontWeight: FontWeight.semibold,
    lineHeight: 16,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  reviewCount: {
    fontWeight: '500',
  },

  price: {
    fontWeight: FontWeight.bold,
  },
});
