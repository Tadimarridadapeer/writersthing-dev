export function getPagination(page: number, limit: number = 20) {
  const from = (page - 1) * limit;
  // We fetch limit + 1 items so we can detect if there's a "next page" without calculating totalCount.
  const to = from + limit;
  return { from, to };
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextPage: number | null;
}
