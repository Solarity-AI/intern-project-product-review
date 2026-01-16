import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = "https://product-review-app-solarityai-a391ad53d79a.herokuapp.com";
//const BASE_URL = "http://192.168.1.6:8080";


// const BASE_URL = "http://10.3.137.113:8080"; //EREN LOCAL URL

const USER_ID_KEY = 'device_user_id';

// Get or create a persistent User ID
export async function getUserId(): Promise<string> {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = uuidv4();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (e) {
    console.error('Error getting user ID', e);
    return 'anonymous-user';
  }
}

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
  last: boolean;
};

export type ApiProduct = {
  id: number;
  name: string;
  description: string;
  categories: string[]; // ✨ Changed from category: string to categories: string[]
  price: number;
  averageRating?: number;
  reviewCount?: number;
  ratingBreakdown?: Record<number, number>;
  imageUrl?: string;
  aiSummary?: string;
};

export type ApiReview = {
  id?: number;
  reviewerName?: string;
  rating: number;
  comment: string;
  helpfulCount?: number;
  createdAt?: string;
};

export type ApiNotification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  productId?: number;
};

// ✨ NEW: Global stats type
export type GlobalStats = {
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const userId = await getUserId();
  
  const headers = {
    ...options?.headers,
    'X-User-ID': userId,
  };

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  
  const text = await res.text();
  return text ? JSON.parse(text) : {} as T;
}

// ✨ NEW: Get global stats for hero section (supports filtering)
export function getGlobalStats(params?: { category?: string; search?: string }) {
  const q = new URLSearchParams();
  
  if (params?.category && params.category !== 'All') {
    q.append('category', params.category);
  }
  
  if (params?.search) {
    q.append('search', params.search);
  }
  
  const queryString = q.toString();
  const url = queryString 
    ? `${BASE_URL}/api/products/stats?${queryString}` 
    : `${BASE_URL}/api/products/stats`;
    
  return request<GlobalStats>(url);
}

export function getProducts(params?: { page?: number; size?: number; sort?: string; category?: string; search?: string }) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 0),
    size: String(params?.size ?? 10),
    sort: params?.sort ?? "name,asc",
  });
  
  if (params?.category && params.category !== 'All') {
    q.append('category', params.category);
  }
  
  if (params?.search) {
    q.append('search', params.search);
  }
  
  return request<Page<ApiProduct>>(`${BASE_URL}/api/products?${q.toString()}`);
}

export function getProduct(id: number | string) {
  return request<ApiProduct>(`${BASE_URL}/api/products/${id}`);
}

export function getReviews(productId: number | string, params?: { page?: number; size?: number; sort?: string; rating?: number | null }) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 0),
    size: String(params?.size ?? 10),
    sort: params?.sort ?? "createdAt,desc",
  });
  
  if (params?.rating) {
    q.append('rating', String(params.rating));
  }
  
  return request<Page<ApiReview>>(`${BASE_URL}/api/products/${productId}/reviews?${q.toString()}`);
}

export function postReview(productId: number | string, body: ApiReview) {
  return request<ApiReview>(`${BASE_URL}/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function markReviewAsHelpful(reviewId: number | string) {
  return request<ApiReview>(`${BASE_URL}/api/products/reviews/${reviewId}/helpful`, {
    method: "PUT",
  });
}

export function getUserVotedReviews() {
  return request<number[]>(`${BASE_URL}/api/products/reviews/voted`);
}

export function chatWithAI(productId: number | string, question: string) {
  return request<{ answer: string }>(`${BASE_URL}/api/products/${productId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

// --- User Persistence (Wishlist & Notifications) ---

export function getWishlist() {
  return request<number[]>(`${BASE_URL}/api/user/wishlist`);
}

// ✨ Get full product details for wishlist items
export async function getWishlistProducts(): Promise<ApiProduct[]> {
  const productIds = await getWishlist();
  if (!productIds || productIds.length === 0) return [];
  
  // Fetch each product's details in parallel
  const products = await Promise.all(
    productIds.map(id => getProduct(id).catch(() => null))
  );
  
  // Filter out any failed fetches
  return products.filter((p): p is ApiProduct => p !== null);
}

export function toggleWishlistApi(productId: number) {
  return request<void>(`${BASE_URL}/api/user/wishlist/${productId}`, {
    method: "POST",
  });
}

export function getNotifications() {
  return request<ApiNotification[]>(`${BASE_URL}/api/user/notifications`);
}

export function getUnreadCount() {
  return request<{ count: number }>(`${BASE_URL}/api/user/notifications/unread-count`);
}

export function markNotificationAsRead(id: number) {
  return request<void>(`${BASE_URL}/api/user/notifications/${id}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsAsRead() {
  return request<void>(`${BASE_URL}/api/user/notifications/read-all`, {
    method: "PUT",
  });
}

export function createNotification(title: string, message: string, productId?: number) {
  return request<void>(`${BASE_URL}/api/user/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, productId }),
  });
}

export function deleteNotification(id: number) {
  return request<void>(`${BASE_URL}/api/user/notifications/${id}`, {
    method: "DELETE",
  });
}

export function deleteAllNotifications() {
  return request<void>(`${BASE_URL}/api/user/notifications`, {
    method: "DELETE",
  });
}