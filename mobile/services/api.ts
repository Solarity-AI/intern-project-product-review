const BASE_URL = "http://10.249.128.215:8080"; 
// telefonda tarayıcıda denediğin IP + :8080

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
};

export type ApiProduct = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  averageRating?: number;
  reviewCount?: number;
};

export type ApiReview = {
  id?: number;
  reviewerName?: string;
  rating: number;
  comment: string;
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

export function getProducts(params?: { page?: number; size?: number; sort?: string }) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 0),
    size: String(params?.size ?? 10),
    sort: params?.sort ?? "name,asc",
  });
  return request<Page<ApiProduct>>(`${BASE_URL}/api/products?${q.toString()}`);
}

export function getProduct(id: number | string) {
  return request<ApiProduct>(`${BASE_URL}/api/products/${id}`);
}

export function getReviews(productId: number | string) {
  return request<ApiReview[]>(`${BASE_URL}/api/products/${productId}/reviews`);
}

export function postReview(productId: number | string, body: ApiReview) {
  return request<ApiReview>(`${BASE_URL}/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
