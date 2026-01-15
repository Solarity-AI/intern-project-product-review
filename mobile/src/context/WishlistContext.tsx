// Wishlist Context for managing favorite products
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWishlist as getWishlistApi, toggleWishlistApi } from '../services/api';

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
  addMultipleToWishlist: (products: Array<Omit<WishlistItem, 'addedAt'>>) => void;
  removeFromWishlist: (productId: string) => void;
  removeMultipleFromWishlist: (productIds: string[]) => void;
  toggleWishlist: (product: Omit<WishlistItem, 'addedAt'>) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load wishlist from AsyncStorage AND Backend on mount
  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      // 1. Load local cache (for immediate UI)
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      let localItems: WishlistItem[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        localItems = parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        setWishlist(localItems);
      }

      // 2. Sync with Backend (Source of Truth)
      const backendIds = await getWishlistApi();
      
      // Filter local items to match backend IDs (remove deleted ones)
      // Note: If backend has IDs that local doesn't, we can't show them fully yet 
      // because we lack product details. Ideally, we'd fetch details for missing IDs.
      // For now, we assume local cache is mostly up to date or we keep local items if backend fails.
      
      if (backendIds && backendIds.length > 0) {
        const backendIdSet = new Set(backendIds.map(String));
        const syncedItems = localItems.filter(item => backendIdSet.has(item.id));
        
        // If backend has more items than local, we might be missing data.
        // In a real app, we would fetch product details for (backendIds - localIds).
        
        setWishlist(syncedItems);
        saveWishlistToStorage(syncedItems);
      } else if (backendIds && backendIds.length === 0) {
        // Backend says empty, so clear local
        setWishlist([]);
        saveWishlistToStorage([]);
      }

    } catch (error) {
      console.error('Error syncing wishlist:', error);
    }
  };

  const saveWishlistToStorage = async (items: WishlistItem[]) => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist locally:', error);
    }
  };

  const wishlistCount = wishlist.length;

  const isInWishlist = useCallback(
    (productId: string | number) => {
      const idStr = String(productId);
      return wishlist.some((item) => String(item.id) === idStr);
    },
    [wishlist]
  );

  const addToWishlist = useCallback(
    (product: Omit<WishlistItem, 'addedAt'>) => {
      setWishlist(currentWishlist => {
        const idStr = String(product.id);
        if (currentWishlist.some(item => String(item.id) === idStr)) {
          return currentWishlist;
        }

        const newItem: WishlistItem = {
          ...product,
          id: idStr,
          addedAt: new Date(),
        };
        
        const updated = [newItem, ...currentWishlist];
        saveWishlistToStorage(updated);
        
        // Sync with Backend
        toggleWishlistApi(Number(idStr)).catch(e => console.error("Backend sync failed", e));
        return updated;
      });
    },
    []
  );

  const addMultipleToWishlist = useCallback(
    (products: Array<Omit<WishlistItem, 'addedAt'>>) => {
      setWishlist(currentWishlist => {
        const existingIds = new Set(currentWishlist.map(item => String(item.id)));
        const uniqueNewProducts = Array.from(new Map(products.map(p => [String(p.id), p])).values());
        
        const newItems = uniqueNewProducts
          .filter(p => !existingIds.has(String(p.id)))
          .map(p => ({
            ...p,
            id: String(p.id),
            addedAt: new Date(),
          }));
        
        if (newItems.length === 0) return currentWishlist;

        const updated = [...newItems, ...currentWishlist];
        saveWishlistToStorage(updated);
        
        // Sync each item (Parallel)
        newItems.forEach(item => {
          toggleWishlistApi(Number(item.id)).catch(e => console.error("Backend sync failed", e));
        });

        return updated;
      });
    },
    []
  );

  const removeFromWishlist = useCallback(
    (productId: string | number) => {
      setWishlist(currentWishlist => {
        const idStr = String(productId);
        if (!currentWishlist.some(item => String(item.id) === idStr)) {
          return currentWishlist;
        }

        const updated = currentWishlist.filter((item) => String(item.id) !== idStr);
        saveWishlistToStorage(updated);
        
        // Sync with Backend
        toggleWishlistApi(Number(idStr)).catch(e => console.error("Backend sync failed", e));
        return updated;
      });
    },
    []
  );

  const removeMultipleFromWishlist = useCallback(
    (productIds: Array<string | number>) => {
      setWishlist(currentWishlist => {
        const idsSet = new Set(productIds.map(String));
        const toRemove = currentWishlist.filter(item => idsSet.has(String(item.id)));
        
        if (toRemove.length === 0) return currentWishlist;

        const updated = currentWishlist.filter((item) => !idsSet.has(String(item.id)));
        saveWishlistToStorage(updated);
        
        // Sync each item
        toRemove.forEach(item => {
          toggleWishlistApi(Number(item.id)).catch(e => console.error("Backend sync failed", e));
        });

        return updated;
      });
    },
    []
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
    // Get current IDs to remove them from backend
    const currentIds = wishlist.map(item => item.id);
    
    setWishlist([]);
    saveWishlistToStorage([]);
    
    // Remove all from backend
    currentIds.forEach(id => {
      toggleWishlistApi(Number(id)).catch(e => console.error("Backend sync failed", e));
    });
  }, [wishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        isInWishlist,
        addToWishlist,
        addMultipleToWishlist,
        removeFromWishlist,
        removeMultipleFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
