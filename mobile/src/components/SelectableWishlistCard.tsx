import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
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
  numColumns?: 1 | 2 | 3;
}

function SelectableWishlistCardComponent({
  item,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
  onRemove,
  numColumns,
}: SelectableWishlistCardProps) {

  const { colors } = useTheme();
  const [imageError, setImageError] = React.useState(false);
  const [imageKey, setImageKey] = React.useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelectionMode) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -1.2,
            duration: 85,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 1.2,
            duration: 85,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 85,
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
    inputRange: [-1.2, 1.2],
    outputRange: ['-1.2deg', '1.2deg'],
  });

  return (
    <View style={{ zIndex: isSelectionMode ? (isSelected ? 2 : 1) : 1 }}>
      <Animated.View
        style={
          isSelectionMode
            ? [
                {
                  transform: [{ rotate: rotateInterpolate }],
                  marginHorizontal: 2,
                  elevation: isSelected ? 4 : 2,
                },
              ]
            : []
        }
        collapsable={false}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.card,
            { backgroundColor: colors.card, opacity: 1 },
            isSelectionMode && styles.cardSelectionMode,
            isSelected && [styles.cardSelected, { borderColor: colors.primary }],
          ]}
          onPress={() => onPress(item)}
          onLongPress={() => onLongPress(item)}
          delayLongPress={2250}
        >
          <View 
            style={[
              styles.imageContainer,
              numColumns !== undefined && numColumns >= 2 && styles.imageContainerCompact
            ]} 
            collapsable={false}
          >
            {item.imageUrl && !imageError && (
              <Image
                key={`${item.id}-${imageKey}`}
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onError={() => {
                  setImageError(true);
                  setImageKey(prev => prev + 1);
                }}
              />
            )}
            {(!item.imageUrl || imageError) && (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
                <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
              </View>
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
            <View style={styles.compactTopRow}>
              {item.category && (
                <View style={[styles.categoryBadgeCompact, { backgroundColor: colors.secondary + '88' }, numColumns !== undefined && numColumns >= 2 && { marginLeft: -Spacing.xs }]}>
                  <Text style={[styles.categoryTextCompact, { color: colors.mutedForeground }]}>
                    {item.category}
                  </Text>
                </View>
              )}
              {!isSelectionMode && (
                <TouchableOpacity
                  onPress={() => onRemove(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={numColumns !== undefined && numColumns >= 2 ? { marginRight: -Spacing.xs } : undefined}
                >
                  <Ionicons 
                    name="heart" 
                    size={numColumns >= 3 ? 16 : 20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text numberOfLines={2} style={[styles.name, { color: colors.foreground }]}>
              {item.name}
            </Text>

            {item.averageRating !== undefined && (
              <View style={styles.ratingRow}>
                <StarRating rating={item.averageRating} size="sm" compact={numColumns >= 3} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.reviewCount,
                    { color: colors.mutedForeground },
                    numColumns >= 3 && styles.reviewCountCompact,
                  ]}
                >
                  ({(item as any).reviewCount ?? 0})
                </Text>
              </View>
            )}

            {item.price !== undefined && (
              <Text style={[styles.price, { color: colors.primary }]}>
                ${item.price.toFixed(2)}
              </Text>
            )}

            {item.category && numColumns < 3 && false && (
              <Text style={[styles.category, { color: colors.mutedForeground }]}>
                {item.category}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export const SelectableWishlistCard = memo(SelectableWishlistCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  cardSelectionMode: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  cardSelected: {
    borderWidth: 2,
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    maxHeight: 320,
    overflow: 'hidden',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  imageContainerCompact: {
    aspectRatio: 1,
    maxHeight: 170,
    backgroundColor: '#f0f0f0',
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
    top: Spacing.xs,
    right: Spacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Shadow.soft,
  },

  selectionIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
    ...Shadow.soft,
  },

  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  categoryBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    maxWidth: '80%',
  },
  categoryTextCompact: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },

  content: {
    padding: Spacing.sm,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  reviewCount: {
    fontSize: 10,
  },
  reviewCountCompact: {
    fontSize: 9,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  category: {
    fontSize: 10,
  },
});