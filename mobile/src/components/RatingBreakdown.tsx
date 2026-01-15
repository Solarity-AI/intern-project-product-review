// React Native RatingBreakdown Component
// Visual breakdown of rating distribution + clickable filter

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface RatingBreakdownProps {
  // Option 1: Use pre-calculated breakdown from backend
  breakdown?: Record<number, number>;
  totalCount?: number;

  // Option 2: Calculate from reviews list (legacy/fallback)
  reviews?: { rating: number }[];

  // Click-to-filter
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void; // null => clear
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  breakdown,
  totalCount,
  reviews,
  selectedRating = null,
  onSelectRating,
}) => {
  const { colors } = useTheme();

  const data = useMemo(() => {
    // If backend provides breakdown, use it
    if (breakdown) {
      const total = totalCount ?? Object.values(breakdown).reduce((a, b) => a + b, 0);
      return {
        counts: [5, 4, 3, 2, 1].map(r => ({ rating: r, count: breakdown[r] || 0 })),
        total
      };
    }
    
    // Fallback: calculate from reviews list
    const list = reviews || [];
    return {
      counts: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: list.filter((r) => Math.floor(r.rating) === rating).length,
      })),
      total: list.length
    };
  }, [breakdown, totalCount, reviews]);

  const { counts, total } = data;

  return (
    <View style={styles.container}>
      {counts.map(({ rating, count }) => {
        const percent = total === 0 ? 0 : (count / total) * 100;
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
                  { width: `${percent}%`, opacity: total === 0 ? 0.3 : 1 },
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
