// React Native ProductListScreen with SafeArea fix and Notifications header button
import React, { useEffect, useMemo, useState } from 'react';
import { getProducts, ApiProduct } from '../services/api';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { SearchBar } from '../components/SearchBar';
import { useNotifications } from '../context/NotificationContext';
import { RootStackParamList } from '../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = Colors.light;
  const { unreadCount } = useNotifications();

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const page = await getProducts({ page: 0, size: 50, sort: 'name,asc' });
        if (mounted) setApiProducts(page.content);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'API error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = apiProducts;
    if (selectedCategory !== 'All') filtered = filtered.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [apiProducts, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const totalReviews = apiProducts.reduce((acc, p) => acc + (p.reviewCount ?? 0), 0);
    const sumRating = apiProducts.reduce((acc, p) => acc + (p.averageRating ?? 0), 0);
    const avgRating = apiProducts.length > 0 ? sumRating / apiProducts.length : 0;
    return { totalReviews, avgRating, productCount: apiProducts.length };
  }, [apiProducts]);

  /**
   * ✅ KEY FIX:
   * Make header a stable element (memoized),
   * instead of passing a function that gets recreated on each keystroke.
   */
  const header = useMemo(() => (
    <View>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.logoIcon}>
            <Ionicons name="star" size={16} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.foreground }]}>ProductReview</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.heroSection, { backgroundColor: colors.accent }]}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Find Products You'll <Text style={{ color: colors.primary }}>Love</Text>
        </Text>

        <View style={styles.statsRow}>
          {[
            { icon: 'star', value: stats.avgRating.toFixed(1), label: 'Avg Rating' },
            { icon: 'trending-up', value: stats.totalReviews.toLocaleString(), label: 'Reviews' },
            { icon: 'cube', value: stats.productCount, label: 'Products' }
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={18} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.searchSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Products</Text>
      </View>

      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.destructive, padding: Spacing.lg }}>{error}</Text>}
    </View>
  ), [
    colors,
    navigation,
    unreadCount,
    stats,
    searchQuery,
    selectedCategory,
    loading,
    error,
  ]);

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsVerticalScrollIndicator={false}
        // ✅ Good keyboard defaults for lists + inputs
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  notificationButton: { position: 'relative', padding: Spacing.xs },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },

  heroSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing['2xl'], alignItems: 'center' },
  heroTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing['2xl'] },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statIcon: { width: 36, height: 36, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs },

  searchSection: { paddingVertical: Spacing.lg },
  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

  listContent: { paddingBottom: Spacing['3xl'] },
  columnWrapper: { paddingHorizontal: Spacing.lg, justifyContent: 'space-between', marginTop: Spacing.lg },
});
