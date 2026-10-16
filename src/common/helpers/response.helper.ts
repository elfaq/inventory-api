export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Untuk create, update, delete, dan get satu data
export function successResponse<T>(message: string, data: T): ApiResponse<T> {
  return { message, data };
}

// Untuk get list dengan paginasi
export function paginatedResponse<T>(
  message: string,
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// Hitung skip/take dari page & limit agar rumusnya tidak ditulis ulang di setiap service
export function paginationArgs(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
