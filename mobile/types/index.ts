// TypeScript type definitions for navigation and data models

export type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { 
    productId: string;
    imageUrl?: string;
    name?: string;
  };
  Notifications: undefined;
  NotificationDetail: {
    notificationId: string;
  };
  Wishlist: undefined;
};

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}