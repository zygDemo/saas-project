// api/index.ts
import { http } from "uview-pro";

export const login = (data: Record<string, unknown>) => http.post("/auth/login", data);

export * from "./auth";
export * from "./carloan";
export * from "./food";
export * from "./credit";
export {
  useReadingApi,
  type BookItem,
  type BookDetail,
  type BookListResult,
  type CategoryItem,
  type ChapterItem,
  type ChapterListResult,
  type ChapterContent,
  type BookshelfItem,
  type ReadingStatistics,
  type ReviewItem,
  type ReviewListResult,
} from "./reading";
export * from "./business";
export * from "./mobile-config";
