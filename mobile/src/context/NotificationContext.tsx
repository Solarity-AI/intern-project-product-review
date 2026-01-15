// Notification Context for local notification state management
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  createNotification,
  deleteNotification,
  deleteAllNotifications
} from '../services/api';

export type NotificationType = 'review' | 'order' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  data?: {
    productId?: string;
    productName?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from Backend on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      console.log('Loading notifications from backend...');
      const apiNotifications = await getNotifications();
      console.log('Loaded notifications:', apiNotifications);
      
      const mapped: Notification[] = apiNotifications.map((n: any) => ({
        id: String(n.id),
        type: 'system', // Default type as backend doesn't store type yet
        title: n.title,
        body: n.message,
        timestamp: new Date(n.createdAt),
        // ✨ Fix: Check both 'isRead' and 'read' properties due to JSON serialization
        isRead: n.isRead !== undefined ? n.isRead : n.read,
        data: n.productId ? { productId: String(n.productId) } : undefined
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      // Optimistic update
      const tempId = `local-${Date.now()}`;
      const newNotification: Notification = {
        ...notification,
        id: tempId,
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Sync with Backend
      const productId = notification.data?.productId ? Number(notification.data.productId) : undefined;
      createNotification(notification.title, notification.body, productId)
        .then(() => {
          console.log('Notification saved to backend, reloading...');
          // ✨ Reload to get real IDs from backend
          loadNotifications();
        })
        .catch(e => console.error("Backend sync failed", e));
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    
    // Sync with Backend
    if (!id.startsWith('local-')) {
      markNotificationAsRead(Number(id)).catch(e => console.error("Backend sync failed", e));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    
    // Sync with Backend
    markAllNotificationsAsRead().catch(e => console.error("Backend sync failed", e));
  }, []);

  const clearNotification = useCallback((id: string) => {
    console.log("Attempting to delete notification:", id);
    
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    // Sync with Backend
    if (!id.startsWith('local-')) {
      console.log("Sending DELETE request to backend for ID:", id);
      deleteNotification(Number(id))
        .then(() => console.log("Successfully deleted notification from backend"))
        .catch(e => console.error("Backend delete failed", e));
    } else {
      console.warn('Cannot delete local-only notification from backend yet (wait for sync). ID:', id);
    }
  }, []);

  const clearAll = useCallback(() => {
    console.log("Clearing all notifications");
    // Optimistic update
    setNotifications([]);
    
    // Sync with Backend
    deleteAllNotifications().catch(e => console.error("Backend sync failed", e));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
