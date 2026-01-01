export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

export type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { productId: string };
  Notifications: undefined;
};
