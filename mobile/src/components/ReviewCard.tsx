// React Native ReviewCard Component
// Displays individual review

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './StarRating';
import { Review } from '../types';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ReviewCardProps {
  review: Review;
  onHelpfulPress?: (reviewId: string) => void;
  isHelpful?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpfulPress, isHelpful = false }) => {
  const { colors } = useTheme();

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ✨ Use helpfulCount from API, fallback to helpful or 0
  const helpfulCount = review.helpfulCount ?? review.helpful ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Ionicons name="person" size={20} color={colors.mutedForeground} />
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {review.reviewerName || review.userName} 
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formattedDate}
            </Text>
          </View>
        </View>
        <StarRating rating={review.rating} size="sm" />
      </View>

      {/* Comment */}
      <Text style={[styles.comment, { color: colors.foreground }]}>
        {review.comment}
      </Text>

      {/* Footer */}
      <TouchableOpacity 
        style={[styles.helpfulButton, isHelpful && styles.helpfulButtonActive]} 
        activeOpacity={0.7}
        onPress={() => onHelpfulPress && onHelpfulPress(review.id)}
      >
        <Ionicons 
          name={isHelpful ? "thumbs-up" : "thumbs-up-outline"} 
          size={16} 
          color={isHelpful ? colors.primary : colors.mutedForeground} 
        />
        <Text style={[
          styles.helpfulText, 
          { color: isHelpful ? colors.primary : colors.mutedForeground }
        ]}>
          Helpful ({helpfulCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 0.5,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  date: {
    fontSize: FontSize.sm,
  },
  comment: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
    marginBottom: Spacing.lg,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  helpfulButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpfulText: {
    fontSize: FontSize.sm,
  },
});
