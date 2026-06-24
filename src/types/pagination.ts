export interface CursorPayload {
  createdAt: string;
  id: string;
}

export interface PaginationParams {
  limit: number;
  cursor?: string;
   category?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  category: string;
  price: string;
  createdAt: Date;
}

export interface PaginatedProducts {
  data: ProductResponse[];
  nextCursor: string | null;
}