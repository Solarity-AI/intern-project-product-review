// Wishlist Context for managing favorite products
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_STORAGE_KEY = 'wishlist_products';

export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  averageRating?: number;
  addedAt: Date;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (product: Omit<WishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Omit<WishlistItem, 'addedAt'>) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const withDates = parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        setWishlist(withDates);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const saveWishlist = async (items: WishlistItem[]) => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };

  const wishlistCount = wishlist.length;

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.id === productId);
    },
    [wishlist]
  );

  const addToWishlist = useCallback(
    (product: Omit<WishlistItem, 'addedAt'>) => {
      const newItem: WishlistItem = {
        ...product,
        addedAt: new Date(),
      };
      
      const updated = [newItem, ...wishlist];
      setWishlist(updated);
      saveWishlist(updated);
    },
    [wishlist]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      const updated = wishlist.filter((item) => item.id !== productId);
      setWishlist(updated);
      saveWishlist(updated);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (product: Omit<WishlistItem, 'addedAt'>) => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist]
  );

  const clearWishlist = useCallback(async () => {
    setWishlist([]);
    try {
      await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
