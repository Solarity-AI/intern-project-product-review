// NotificationDetailScreen - Full notification details with actions
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNotifications, NotificationType } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

type RouteType = RouteProp<RootStackParamList, 'NotificationDetail'>;

function getNotificationIcon(type: NotificationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'review':
      return 'star';
    case 'order':
      return 'cube';
    case 'system':
      return 'notifications';
  }
}

function getNotificationColor(type: NotificationType, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (type) {
    case 'review':
      return colors.primary;
    case 'order':
      return colors.success;
    case 'system':
      return '#6366F1'; // Indigo
  }
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NotificationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { notifications, markAsRead, clearNotification } = useNotifications();

  // ✨ Responsive: Get window dimensions
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const MAX_CONTENT_WIDTH = 600;
  const isWideScreen = windowWidth > MAX_CONTENT_WIDTH;

  // ✨ Responsive container style
  const responsiveContainerStyle = {
    width: '100%' as const,
    maxWidth: isWeb ? MAX_CONTENT_WIDTH : undefined,
    alignSelf: 'center' as const,
    flex: 1,
  };

  const notificationId = route.params?.notificationId;

  const notification = useMemo(() => {
    return notifications.find((n) => n.id === notificationId);
  }, [notifications, notificationId]);

  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  // ✨ Improved back handler for Web/Deep Links
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Notifications' as any);
    }
  };

  if (!notification) {
    return (
      <ScreenWrapper backgroundColor={colors.background}>
        {/* ✨ Responsive Wrapper */}
        <View style={responsiveContainerStyle}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              Notification Not Found
            </Text>
            <Text style={[styles.errorSubtitle, { color: colors.mutedForeground }]}>
              This notification may have been deleted.
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const iconColor = getNotificationColor(notification.type, colors);

  const handleDelete = () => {
    clearNotification(notification.id);
    handleBack();
  };

  const handleViewProduct = () => {
    if (notification.data?.productId) {
      navigation.navigate('ProductDetails', {
        productId: notification.data.productId,
      } as any);
    }
  };

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      {/* ✨ Responsive Wrapper */}
      <View style={responsiveContainerStyle}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
          {/* Icon Badge */}
          <View style={styles.iconBadgeContainer}>
            <LinearGradient
              colors={[iconColor, iconColor + 'CC']}
              style={styles.iconBadge}
            >
              <Ionicons name={getNotificationIcon(notification.type)} size={32} color="#fff" />
            </LinearGradient>
          </View>

          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: iconColor + '15' }]}>
            <Text style={[styles.typeBadgeText, { color: iconColor }]}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {notification.title}
          </Text>

          {/* Timestamp */}
          <View style={styles.timestampContainer}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
              {formatFullDate(notification.timestamp)}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Body */}
          <Text style={[styles.body, { color: colors.foreground }]}>
            {notification.body}
          </Text>

          {/* Additional Info */}
          {notification.data?.productName && (
            <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Product:
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {notification.data.productName}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {notification.data?.productId && (
              <TouchableOpacity
                onPress={handleViewProduct}
                activeOpacity={0.8}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
                  View Product
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              style={[styles.actionButton, styles.deleteActionButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                Delete Notification
              </Text>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </View>{/* ✨ End Responsive Wrapper */}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },

  content: {
    padding: Spacing.lg,
  },

  iconBadgeContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  typeBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: FontSize['2xl'] * 1.3,
  },

  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  timestamp: {
    fontSize: FontSize.sm,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },

  body: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.6,
    marginBottom: Spacing.xl,
  },

  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },

  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.soft,
  },
  deleteActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
  },
});