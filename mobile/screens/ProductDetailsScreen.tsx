// React Native ProductDetailsScreen
// Rating breakdown click-to-filter + helpful + review submit refresh + robust image fallback + Pagination + Server-side Filtering
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { StarRating } from '../components/StarRating';
import { ReviewCard } from '../components/ReviewCard';
import { RatingBreakdown } from '../components/RatingBreakdown';
import { Button } from '../components/Button';
import { AddReviewModal } from '../components/AddReviewModal';

import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { RootStackParamList, Review } from '../types';
import {
  getProduct,
  getReviews,
  postReview,
  markReviewAsHelpful,
  ApiProduct,
  ApiReview,
} from '../services/api';
import { useToast } from '../context/ToastContext';

type RouteT = RouteProp<RootStackParamList, 'ProductDetails'>;

function apiReviewToUiReview(productId: string, r: ApiReview): Review {
  return {
    id: String((r as any).id ?? `r-${Date.now()}`),
    productId,
    userName: (r as any).reviewerName ?? 'Anonymous',
    rating: (r as any).rating ?? 0,
    comment: (r as any).comment ?? '',
    createdAt: (r as any).createdAt ?? new Date().toISOString(),
    helpful: (r as any).helpfulCount ?? 0,
  } as Review;
}

function pickImageUri(p: any): string | null {
  if (!p) return null;

  const candidates = [
    p?.imageUrl,
    p?.imageURL,
    p?.imageUri,
    p?.imageURI,
    p?.image,
    p?.img,
    p?.thumbnailUrl,
    p?.thumbnail,
    p?.photoUrl,
    p?.photo,
    p?.pictureUrl,
    p?.picture,
    p?.image_url,
    p?.image_uri,
    p?.image_path,
    p?.thumbnail_url,
    p?.photo_url,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
  }

  const nested =
    p?.image?.url ||
    p?.image?.uri ||
    p?.thumbnail?.url ||
    p?.photo?.url ||
    p?.picture?.url;

  if (typeof nested === 'string' && nested.trim().length > 0) return nested.trim();

  const firstFromArray =
    (Array.isArray(p?.images) && (p.images[0]?.url || p.images[0]?.uri || p.images[0])) ||
    (Array.isArray(p?.photos) && (p.photos[0]?.url || p.photos[0]?.uri || p.photos[0]));

  if (typeof firstFromArray === 'string' && firstFromArray.trim().length > 0) return firstFromArray.trim();
  if (typeof firstFromArray === 'object') {
    const v = firstFromArray?.url || firstFromArray?.uri;
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }

  return null;
}

function normalizeImageUri(uri: string | null): string | null {
  if (!uri) return null;
  const u = uri.trim();
  if (!u) return null;

  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return `https:${u}`;

  return u;
}

export const ProductDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteT>();
  const { showToast } = useToast();
  const colors = Colors.light;

  const productId = String((route.params as any)?.productId ?? (route.params as any)?.id ?? '');
  const routeImageUrl = String((route.params as any)?.imageUrl ?? '');
  const routeName = String((route.params as any)?.name ?? '');

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('helpful_reviews');
        if (stored) setHelpfulReviews(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const persistHelpful = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem('helpful_reviews', JSON.stringify(ids));
    } catch {}
  }, []);

  // Fetch product and initial reviews (with optional rating filter)
  const fetchProductAndReviews = useCallback(async (resetReviews = false) => {
    try {
      if (resetReviews) {
        setLoading(true);
        setReviews([]);
      }
      
      setError(null);
      setPage(0);
      setHasMore(true);

      // If we already have product, don't fetch it again unless necessary
      const productPromise = product ? Promise.resolve(product) : getProduct(productId);
      
      const [p, revPage] = await Promise.all([
        productPromise,
        getReviews(productId, { page: 0, size: 5, rating: selectedRating })
      ]);
      
      setProduct(p);
      
      const newReviews = (revPage.content ?? []).map((r) => apiReviewToUiReview(productId, r));
      setReviews(newReviews);
      setHasMore(!revPage.last);
      
    } catch (e: any) {
      setError(e?.message ?? 'API error');
    } finally {
      setLoading(false);
    }
  }, [productId, selectedRating, product]);

  // Initial load
  useEffect(() => {
    fetchProductAndReviews(true);
  }, [productId]); // Only on mount or productId change

  // When rating filter changes, re-fetch reviews
  useEffect(() => {
    // Skip initial mount to avoid double fetch
    if (!loading) {
      fetchProductAndReviews(false);
    }
  }, [selectedRating]);

  const loadMoreReviews = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const revPage = await getReviews(productId, { page: nextPage, size: 5, rating: selectedRating });
      
      const newReviews = (revPage.content ?? []).map((r) => apiReviewToUiReview(productId, r));
      setReviews(prev => [...prev, ...newReviews]);
      
      setPage(nextPage);
      setHasMore(!revPage.last);
    } catch (e) {
      // silent fail or toast
    } finally {
      setLoadingMore(false);
    }
  };

  const avgRating = useMemo(() => {
    if (product?.averageRating) return product.averageRating;
    if (!reviews.length) return 0;
    return reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length;
  }, [reviews, product]);

  const imageUri = useMemo(() => {
    const fromProduct = product ? pickImageUri(product) : null;
    const fallback = routeImageUrl && routeImageUrl.trim().length > 0 ? routeImageUrl.trim() : null;
    return normalizeImageUri(fromProduct ?? fallback);
  }, [product, routeImageUrl]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  const handleHelpfulPress = async (reviewId: string) => {
    if (helpfulReviews.includes(reviewId)) return;

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful ?? 0) + 1 } : r))
    );

    const next = [...helpfulReviews, reviewId];
    setHelpfulReviews(next);
    persistHelpful(next);

    try {
      await (markReviewAsHelpful as any)(reviewId);
    } catch {}
  };

  const handleAddReview = async (payload: { userName: string; rating: number; comment: string }) => {
    try {
      await postReview(productId, {
        reviewerName: payload.userName,
        rating: payload.rating,
        comment: payload.comment,
      });

      showToast({ type: 'success', title: 'Review added', message: 'Thanks for your feedback!' });

      // Refresh list
      setSelectedRating(null); // Reset filter to show new review
      await fetchProductAndReviews(false);
      setIsReviewModalOpen(false);
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Submission failed',
        message: e?.message ?? 'Could not submit review.',
      });
    }
  };

  if (loading && !product) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error && !product) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: colors.destructive, fontWeight: FontWeight.semibold }}>
            {error}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const displayName = (product as any)?.name ?? routeName ?? 'Product';

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          <Text style={[styles.backButtonText, { color: colors.foreground }]}>Back</Text>
        </TouchableOpacity>

        <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
          {imageUri && !imageFailed ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => {
                  setImageFailed(true);
                }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
                style={styles.imageOverlay}
              />
              <Text style={styles.imageText}>{displayName}</Text>
            </>
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={28} color={colors.mutedForeground} />
              <Text style={{ marginTop: 8, color: colors.mutedForeground, fontSize: FontSize.sm }}>
                No image available
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{displayName}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={avgRating} size="md" />
            <Text style={[styles.ratingMeta, { color: colors.mutedForeground }]}>
              {avgRating.toFixed(1)} ({product?.reviewCount ?? reviews.length} reviews)
            </Text>
          </View>

          {!!(product as any)?.description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {(product as any)?.description}
            </Text>
          )}

          {/* Rating Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rating Breakdown</Text>

              {selectedRating !== null && (
                <TouchableOpacity
                  onPress={() => setSelectedRating(null)}
                  style={[styles.clearPill, { backgroundColor: colors.secondary }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={14} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, fontSize: FontSize.xs }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <RatingBreakdown
              breakdown={(product as any)?.ratingBreakdown}
              totalCount={(product as any)?.reviewCount}
              reviews={reviews}
              selectedRating={selectedRating}
              onSelectRating={setSelectedRating}
            />
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Reviews {selectedRating !== null ? `(${selectedRating}★)` : ''}
              </Text>

              <Button variant="premium" onPress={() => setIsReviewModalOpen(true)}>
                Add Review
              </Button>
            </View>

            {reviews.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No reviews found.</Text>
            ) : (
              <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    onHelpfulPress={handleHelpfulPress}
                    isHelpful={helpfulReviews.includes(r.id)}
                  />
                ))}
              </View>
            )}
            
            {/* Load More Button */}
            {hasMore && (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={loadMoreReviews}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={{ color: colors.primary, fontWeight: FontWeight.medium }}>
                    Load More Reviews
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <AddReviewModal
        visible={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productName={displayName}
        onSubmit={handleAddReview}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  imageContainer: {
    aspectRatio: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  imageText: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    color: '#fff',
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingMeta: { fontSize: FontSize.sm },

  description: { fontSize: FontSize.base, lineHeight: 20 },

  section: { gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  
  loadMoreButton: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
