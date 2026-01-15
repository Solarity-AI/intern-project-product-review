// Shopify/Amazon-style Notifications Screen
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNotifications, Notification, NotificationType } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

type FilterType = 'all' | NotificationType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'review', label: 'Reviews' },
  { key: 'order', label: 'Orders' },
  { key: 'system', label: 'System' },
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

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

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

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
  };

  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate to notification detail screen
    navigation.navigate('NotificationDetail', { notificationId: notification.id } as any);
  };

  // ✨ Improved back handler for Web/Deep Links
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ProductList' as any);
    }
  };

  const renderFilterChip = ({ key, label }: { key: FilterType; label: string }) => {
    const isSelected = selectedFilter === key;
    return (
      <TouchableOpacity
        key={key}
        onPress={() => setSelectedFilter(key)}
        activeOpacity={0.8}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? colors.foreground : colors.card,
            borderColor: isSelected ? colors.foreground : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: isSelected ? colors.card : colors.foreground },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconColor = getNotificationColor(item.type, colors);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.isRead ? colors.card : colors.accent,
            borderColor: item.isRead ? colors.border : colors.primary + '30',
          },
        ]}
      >
        {/* Unread dot indicator */}
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={getNotificationIcon(item.type)} size={20} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: colors.foreground,
                fontWeight: item.isRead ? FontWeight.medium : FontWeight.bold,
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.notificationBody, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
            {getTimeAgo(item.timestamp)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name="notifications-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        When you get notifications, they'll show up here
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {FILTERS.map(renderFilterChip)}
      </View>
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      {/* ✨ Responsive Wrapper */}
      <View style={responsiveContainerStyle}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                  {unreadCount} unread
                </Text>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
              <Text style={[styles.markAllRead, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  markAllRead: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    position: 'relative',
    ...Shadow.soft,
  },
  unreadDot: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: FontSize.sm,
  },
  notificationBody: {
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.4,
  },
  timestampContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: FontSize.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});