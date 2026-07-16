import type { CreditListItem } from "@/api/carloan";

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export type BusinessNodeFilterValue = "all" | "precheck" | "supplement" | "signing" | "disbursement";
export type NodeStatusFilterValue = "all" | string;

export interface OrderListViewItem extends CreditListItem {
  name: string;
  phone: string;
  statusClass: string;
  businessNode: string;
  businessNodeLabel: string;
  nodeStatusLabel: string;
  vehicleDisplay: string;
  createTime: string;
  creditOrderId?: string;
  pushQuota?: string;
  periods?: string | number;
}
