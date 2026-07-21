import { http } from "uview-pro";

export interface AnnouncementItem {
  id: number;
  tenantId: number;
  title: string;
  content: string;
  type: string;
  status: string;
  publishAt?: string;
  expireAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementQuery {
  page?: number;
  size?: number;
  status?: string;
  type?: string;
}

/** 获取公告列表 */
export const fetchAnnouncementList = (params: AnnouncementQuery) =>
  http.get<{ list: AnnouncementItem[]; total: number }>("/announcement/list", params);

/** 获取当前有效公告（首页/消息中心用） */
export const fetchActiveAnnouncements = () =>
  http.get<AnnouncementItem[]>("/announcement/active");

/** 获取公告详情 */
export const fetchAnnouncementDetail = (id: number) =>
  http.get<AnnouncementItem>(`/announcement/${id}`);
