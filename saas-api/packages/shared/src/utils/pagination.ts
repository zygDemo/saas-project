import { PaginatedResponse, PaginationMeta, PaginationQuery } from '../types/pagination';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 1000;

export function getPagination(query: PaginationQuery): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize, page, pageSize };
}

export function toPaginatedResponse<T>(list: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  const meta: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
  return { list, meta };
}
