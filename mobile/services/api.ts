const BASE_URL = "https://product-review-app-solarityai-a391ad53d79a.herokuapp.com"; 
// const BASE_URL = "http://192.168.1.6:8080";

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
  category: string;
  price: number;
  averageRating?: number;
  reviewCount?: number;
  ratingBreakdown?: Record<number, number>;
};

export type ApiReview = {
  id?: number;
  reviewerName?: string;
  rating: number;
  comment: string;
  helpfulCount?: number;
  createdAt?: string;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getProducts(params?: { page?: number; size?: number; sort?: string; category?: string }) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 0),
    size: String(params?.size ?? 10),
    sort: params?.sort ?? "name,asc",
  });
  
  if (params?.category && params.category !== 'All') {
    q.append('category', params.category);
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
