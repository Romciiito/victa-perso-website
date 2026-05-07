// Shared TypeScript types
// Add your domain types here

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  nextCursor: string | null;
}