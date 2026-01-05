// React Native SortFilter Component
// Horizontal scrollable sort chips

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../constants/theme';

export type SortOption = {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: 'name,asc', label: 'Name (A-Z)', icon: 'text' },
  { value: 'name,desc', label: 'Name (Z-A)', icon: 'text' },
  { value: 'averageRating,desc', label: 'Top Rated', icon: 'star' },
  { value: 'averageRating,asc', label: 'Low Rated', icon: 'star-outline' },
  { value: 'price,asc', label: 'Price: Low-High', icon: 'arrow-up' },
  { value: 'price,desc', label: 'Price: High-Low', icon: 'arrow-down' },
  { value: 'reviewCount,desc', label: 'Most Reviewed', icon: 'chatbubbles' },
];

interface SortFilterProps {
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

export const SortFilter: React.FC<SortFilterProps> = ({
  selectedSort,
  onSortChange,
}) => {
  const colors = Colors.light;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {SORT_OPTIONS.map((option) => {
        const isSelected = selectedSort === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSortChange(option.value)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.secondary,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={isSelected ? colors.primaryForeground : colors.secondaryForeground}
            />
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? colors.primaryForeground : colors.secondaryForeground },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
