// React Native StarRating Component
// Compatible with iOS and Android

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  style?: ViewStyle;
  compact?: boolean; // FIX: 4 sütunda küçük yıldız
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  style,
  compact = false, // FIX: Default false
}) => {
  const { colors } = useTheme();
  // FIX: 4 sütunda 12px, yoksa normal
  const iconSize = compact ? 12 : sizeMap[size];

  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const floorRating = Math.floor(rating);
    const isFull = index < floorRating;
    const isHalf = index === floorRating && rating % 1 >= 0.2 && rating % 1 < 0.8;
    const isActuallyFull = index === floorRating && rating % 1 >= 0.8;

    const StarComponent = interactive ? TouchableOpacity : View;

    let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
    if (isFull || isActuallyFull) {
      iconName = 'star';
    } else if (isHalf) {
      iconName = 'star-half';
    }

    const isFilled = iconName !== 'star-outline';

    return (
      <StarComponent
        key={index}
        onPress={() => handlePress(index)}
        style={styles.starContainer}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={isFilled ? colors.starFilled : colors.starEmpty}
        />
      </StarComponent>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {Array.from({ length: maxRating }).map((_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={[styles.valueText, { color: colors.foreground }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starContainer: {
    padding: 2,
  },
  valueText: {
    marginLeft: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
