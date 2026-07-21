import { http } from "uview-pro";

export interface NotificationItem {
  id: number;
  tenantId: number;
  userId: number | null;
  type: string;
  title: string;
  content: string;
  extra?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPageResult {
  records: NotificationItem[];
  total: number;
  current: number;
  size: number;
}

/** 获取当前用户通知列表 */
export const fetchNotificationList = (params?: { current?: number; size?: number }) =>
  http.get<NotificationPageResult>("/notification/list", params);

/** 获取未读通知数量 */
export const fetchUnreadCount = () =>
  http.get<{ count?: number } | number>("/notification/unread-count");

/** 标记单条通知为已读 */
export const markNotificationRead = (id: number) =>
  http.post(`/notification/${id}/read`);

/** 全部标记已读 */
export const markAllNotificationsRead = () =>
  http.post("/notification/read-all");
