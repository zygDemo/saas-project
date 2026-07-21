// api/index.ts
import { http } from "uview-pro";

export const login = (data: Record<string, unknown>) => http.post("/auth/login", data);

export * from "./auth";
export * from "./carloan";
export * from "./food";
export * from "./credit";
export { useReadingApi } from "./reading";
export type {
  BookItem,
  BookDetail,
  BookListResult,
  CategoryItem,
  ChapterItem,
  ChapterLiteItem,
  ChapterListResult,
  ChapterContent,
  BookshelfItem,
  ReadingStatistics,
  ReviewItem,
  NoteItem,
  ReviewListResult,
} from "@/types/api/contract";
export * from "./business";
export * from "./mobile-config";
export * from "./announcement";
