import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StarRating } from './StarRating';
import { useTheme } from '../context/ThemeContext';
import { WishlistItem } from '../context/WishlistContext';
import { Spacing, BorderRadius, Shadow, FontSize, FontWeight } from '../constants/theme';

interface SelectableWishlistCardProps {
  item: WishlistItem;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: (item: WishlistItem) => void;
  onLongPress: (item: WishlistItem) => void;
  onRemove: (id: string) => void;
  width?: string;
  numColumns?: 1 | 2 | 4;
}

export const SelectableWishlistCard: React.FC<SelectableWishlistCardProps> = ({
  item,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
  onRemove,
  numColumns = 2, // ✅ EKLE
  width,
}) => {

  const { colors } = useTheme();

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelectionMode) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -2,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 2,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      shakeAnim.setValue(0);
    }
  }, [isSelectionMode, shakeAnim]);

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <View>
      <Animated.View
        style={
          isSelectionMode
            ? [{ transform: [{ rotate: rotateInterpolate }] }]
            : []
        }
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.card,
            { backgroundColor: colors.card },
            isSelectionMode && styles.cardSelectionMode,
            isSelected && [styles.cardSelected, { borderColor: colors.primary }],
          ]}
          onPress={() => onPress(item)}
          onLongPress={() => onLongPress(item)}
          delayLongPress={2250}
        >
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
                <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
              </View>
            )}

            {!isSelectionMode && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                onPress={() => onRemove(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {isSelectionMode && (
              <View
                style={[
                  styles.selectionIndicator,
                  {
                    backgroundColor: isSelected ? colors.primary : 'rgba(255,255,255,0.9)',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text numberOfLines={2} style={[styles.name, { color: colors.foreground }]}>
              {item.name}
            </Text>

            {item.averageRating !== undefined && (
              <StarRating rating={item.averageRating} size="sm" />
            )}

            {item.price !== undefined && (
              <Text style={[styles.price, { color: colors.primary }]}>
                ${item.price.toFixed(2)}
              </Text>
            )}

            {item.category && (
              <Text style={[styles.category, { color: colors.mutedForeground }]}>
                {item.category}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  cardSelectionMode: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardSelected: {
    borderWidth: 2,
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  content: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  category: {
    fontSize: 10,
  },
});