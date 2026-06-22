// api/index.ts
import { http } from "uview-pro";

export const login = (data: Record<string, unknown>) => http.post("/auth/login", data);

export * from "./auth";
export * from "./carloan";
export * from "./food";
export * from "./credit";
export * from "./reading";
export * from "./business";
