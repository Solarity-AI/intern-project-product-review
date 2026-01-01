// React Native ProductCard Component
import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StarRating } from './StarRating';
import { RootStackParamList } from '../types';
import { Colors, Spacing, FontSize, BorderRadius, Shadow, FontWeight } from '../constants/theme';
import { ApiProduct } from '../services/api';

interface ProductCardProps { product: ApiProduct; }

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.lg * 3) / 2;

function imageForCategory(category?: string) {
  const c = (category ?? '').toLowerCase();
  if (c.includes('audio')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  if (c.includes('electronics')) return 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80';
  if (c.includes('wear')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
  if (c.includes('gaming')) return 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&q=80';
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const imageUri = useMemo(() => imageForCategory(product.category), [product.category]);

  return (
    <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { productId: String(product.id) })} activeOpacity={0.9} style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}><Text style={[styles.categoryText, { color: colors.foreground }]} numberOfLines={1}>{product.category}</Text></View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}><StarRating rating={product.averageRating ?? 0} size="sm" /><Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({product.reviewCount ?? 0})</Text></View>
        <Text style={[styles.price, { color: colors.foreground }]}>${product.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { width: cardWidth, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.soft },
  imageContainer: { position: 'relative', height: 140 },
  image: { width: '100%', height: '100%' },
  categoryBadge: { position: 'absolute', top: Spacing.md, left: Spacing.md, maxWidth: '80%', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, ...Shadow.soft },
  categoryText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  content: { padding: Spacing.md, gap: 6 },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewCount: { fontSize: FontSize.xs },
  price: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
