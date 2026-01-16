// LoadMoreCard.tsx - Professional "Load More" button component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

interface LoadMoreCardProps {
  onPress: () => void;
  loading?: boolean;
  hasMore?: boolean;
  currentPage: number;
  totalPages: number;
}

export const LoadMoreCard: React.FC<LoadMoreCardProps> = ({
  onPress,
  loading = false,
  hasMore = true,
  currentPage,
  totalPages,
}) => {
  const { colors } = useTheme();

  if (!hasMore) {
    return (
      <View
        style={[
          styles.container,
          styles.endContainer,
          { backgroundColor: colors.card },
        ]}
      >
        <View style={[styles.endIconContainer, { backgroundColor: colors.muted }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>

        <Text style={[styles.endText, { color: colors.mutedForeground }]}>
          You've reached the end
        </Text>

        <Text style={[styles.endSubtext, { color: colors.mutedForeground }]}>
          Showing all products
        </Text>
      </View>
    );
  }


  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.gradientCard}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={colors.primaryForeground} />
            <Text style={[styles.loadingText, { color: colors.primaryForeground }]}>
              Loading more products...
            </Text>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="arrow-down-circle" size={28} color={colors.primaryForeground} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.primaryForeground }]}>
                Load More Products
              </Text>
              <Text style={[styles.pageInfo, { color: colors.primaryForeground, opacity: 0.8 }]}>
                Page {currentPage + 1} of {totalPages}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.primaryForeground} />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  iconContainer: {
    // Icon styling
  },

  textContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },

  loadingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },

  pageInfo: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // End state styles - compact
  endIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },

  endText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  endContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  endSubtext: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    marginTop: 2,
  },
});