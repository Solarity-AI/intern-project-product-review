// React Native RatingBreakdown Component
// Visual breakdown of rating distribution + clickable filter

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../constants/theme';

interface RatingBreakdownProps {
  reviews: { rating: number }[];

  // ✅ NEW: optional click-to-filter
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void; // null => clear
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  reviews,
  selectedRating = null,
  onSelectRating,
}) => {
  const colors = Colors.light;
  const totalReviews = reviews.length;

  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => Math.floor(r.rating) === rating).length,
    }));
  }, [reviews]);

  return (
    <View style={styles.container}>
      {ratingCounts.map(({ rating, count }) => {
        const percent = totalReviews === 0 ? 0 : (count / totalReviews) * 100;
        const isSelected = selectedRating === rating;

        return (
          <TouchableOpacity
            key={rating}
            activeOpacity={onSelectRating ? 0.85 : 1}
            onPress={() => {
              if (!onSelectRating) return;
              // toggle behavior
              onSelectRating(isSelected ? null : rating);
            }}
            style={[
              styles.row,
              isSelected && { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={[styles.star, { color: colors.foreground }]}>
              {rating}★
            </Text>

            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.barFill,
                  { width: `${percent}%`, opacity: totalReviews === 0 ? 0.3 : 1 },
                ]}
              />
            </View>

            <Text
              style={[
                styles.count,
                { color: isSelected ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {count}
            </Text>
          </TouchableOpacity>
        );
      })}

      {onSelectRating && selectedRating !== null && (
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
          Showing {selectedRating}★ reviews — tap again to clear.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },

  star: { width: 38, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  count: { width: 32, textAlign: 'right', fontSize: FontSize.sm },

  helperText: { fontSize: FontSize.xs, marginTop: Spacing.xs },
});
