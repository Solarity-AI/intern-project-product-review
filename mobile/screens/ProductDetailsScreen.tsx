// React Native ProductDetailsScreen with SafeArea fix and Toast feedback
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { StarRating } from '../components/StarRating';
import { ReviewCard } from '../components/ReviewCard';
import { RatingBreakdown } from '../components/RatingBreakdown';
import { Button } from '../components/Button';
import { AddReviewModal } from '../components/AddReviewModal';
import { getProduct, getReviews, postReview, ApiProduct, ApiReview } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList, Review } from '../types';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

function imageForCategory(category?: string) {
  const c = (category ?? '').toLowerCase();
  if (c.includes('audio')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  if (c.includes('electronics')) return 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80';
  if (c.includes('wear')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
  if (c.includes('gaming')) return 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&q=80';
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
}

function apiReviewToUiReview(productId: string, r: ApiReview): Review {
  return { id: String(r.id ?? `r-${Date.now()}`), productId, userName: r.reviewerName ?? 'Anonymous', rating: r.rating, comment: r.comment, createdAt: r.createdAt ?? new Date().toISOString().split('T')[0], helpful: 0 };
}

export const ProductDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailsRouteProp>();
  const colors = Colors.light;
  const { addNotification } = useNotifications();
  const { showToast } = useToast();
  const { productId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [p, rev] = await Promise.all([getProduct(productId), getReviews(productId)]);
        if (!mounted) return;
        setProduct(p);
        setReviews(rev.map((r) => apiReviewToUiReview(String(productId), r)));
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'API error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId]);

  const avgRating = useMemo(() => reviews.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0, [reviews]);

  const handleAddReview = async (payload: { userName: string; rating: number; comment: string }) => {
    try {
      setIsReviewModalOpen(false);
      await postReview(productId, { reviewerName: payload.userName, rating: payload.rating, comment: payload.comment });
      const rev = await getReviews(productId);
      setReviews(rev.map((r) => apiReviewToUiReview(String(productId), r)));
      showToast({ type: 'success', title: 'Review submitted!', message: `Your review for ${product?.name ?? 'this product'} was posted successfully.` });
      addNotification({ type: 'review', title: 'Review submitted', body: `Thanks for your review! Your feedback for "${product?.name}" helps other shoppers.`, data: { productId: String(productId), productName: product?.name } });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Submission failed', message: e?.message ?? 'Could not submit review.' });
    }
  };

  if (loading) return <ScreenWrapper><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.mutedForeground }}>Loading...</Text></View></ScreenWrapper>;
  if (error) return <ScreenWrapper><TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={20} color={colors.foreground} /><Text style={{ color: colors.foreground }}>Back</Text></TouchableOpacity><Text style={{ color: colors.destructive, padding: Spacing.lg }}>{error}</Text></ScreenWrapper>;
  if (!product) return <ScreenWrapper><Text style={{ padding: Spacing.lg, color: colors.foreground }}>Product not found</Text></ScreenWrapper>;

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={20} color={colors.foreground} /><Text style={[styles.backButtonText, { color: colors.foreground }]}>Back</Text></TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}><Image source={{ uri: imageForCategory(product.category) }} style={styles.image} /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.imageOverlay} /><View style={styles.imageText}><Text style={styles.productName}>{product.name}</Text><Text style={styles.category}>{product.category}</Text></View></View>
        <View style={styles.content}>
          <Text style={[styles.price, { color: colors.foreground }]}>${product.price.toFixed(2)}</Text>
          <View style={styles.ratingRow}><StarRating rating={avgRating} size="md" /><Text style={[styles.ratingText, { color: colors.mutedForeground }]}>{avgRating.toFixed(1)} ({reviews.length} reviews)</Text></View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>
          <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rating Breakdown</Text><RatingBreakdown reviews={reviews} /></View>
          <View style={styles.section}>
            <View style={styles.reviewsHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reviews</Text><Button onPress={() => setIsReviewModalOpen(true)}>Add Review</Button></View>
            {reviews.length === 0 ? <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No reviews yet.</Text> : <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>{reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</View>}
          </View>
        </View>
      </ScrollView>
      <AddReviewModal visible={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} productName={product.name} onSubmit={handleAddReview} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg },
  backButtonText: { fontSize: FontSize.sm },
  imageContainer: { aspectRatio: 1, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.soft },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  imageText: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: Spacing.lg },
  productName: { color: '#fff', fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  category: { color: '#fff', opacity: 0.9, marginTop: 4 },
  content: { padding: Spacing.lg },
  price: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  ratingText: { fontSize: FontSize.sm },
  description: { fontSize: FontSize.base, lineHeight: FontSize.base * 1.6 },
  section: { marginTop: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
