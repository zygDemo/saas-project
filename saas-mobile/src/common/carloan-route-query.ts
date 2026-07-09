/* 车贷业务路由 query helper：页面传原始值，统一交给 buildRoute/buildHashRoute 序列化编码。 */

export type RouteQueryValue = string | number | boolean | null | undefined;
export type RouteQueryRecord = Record<string, RouteQueryValue>;

export interface CarloanSignRouteQueryInput {
  creditOrderId?: RouteQueryValue;
  uuid?: RouteQueryValue;
  customerName?: RouteQueryValue;
  customerPhone?: RouteQueryValue;
  backUrl?: RouteQueryValue;
  signStatus?: RouteQueryValue;
  name?: RouteQueryValue;
  phone?: RouteQueryValue;
  amount?: RouteQueryValue;
  idCard?: RouteQueryValue;
  orderId?: RouteQueryValue;
  type?: RouteQueryValue;
}

export interface CarloanEntryRouteQueryInput {
  uuid?: RouteQueryValue;
  creditOrderId?: RouteQueryValue;
  name?: RouteQueryValue;
  phone?: RouteQueryValue;
  amount?: RouteQueryValue;
  pushQuota?: RouteQueryValue;
  periods?: RouteQueryValue;
  fromEntry?: RouteQueryValue;
  businessType?: RouteQueryValue;
}

export interface CarloanSupplementRouteQueryInput {
  uuid?: RouteQueryValue;
  creditOrderId?: RouteQueryValue;
  readonly?: RouteQueryValue;
  id?: RouteQueryValue;
  name?: RouteQueryValue;
  phone?: RouteQueryValue;
  remark?: RouteQueryValue;
  isSupplementCustomer?: RouteQueryValue;
  isSupplementVehicle?: RouteQueryValue;
  isSupplementOrder?: RouteQueryValue;
  isSupplementFile?: RouteQueryValue;
}

export interface CarloanDetailRouteQueryInput {
  id?: RouteQueryValue;
  creditOrderId?: RouteQueryValue;
  orderNo?: RouteQueryValue;
  uuid?: RouteQueryValue;
  customerName?: RouteQueryValue;
  customerPhone?: RouteQueryValue;
  name?: RouteQueryValue;
  phone?: RouteQueryValue;
  nodeCode?: RouteQueryValue;
}

export function buildRouteQuery(query: object): RouteQueryRecord {
  return query as RouteQueryRecord;
}

export function buildSignRouteQuery(query: CarloanSignRouteQueryInput): RouteQueryRecord {
  return buildRouteQuery(query);
}

export function buildEntryRouteQuery(query: CarloanEntryRouteQueryInput): RouteQueryRecord {
  return buildRouteQuery(query);
}

export function buildSupplementRouteQuery(query: CarloanSupplementRouteQueryInput): RouteQueryRecord {
  return buildRouteQuery(query);
}

export function buildDetailRouteQuery(query: CarloanDetailRouteQueryInput): RouteQueryRecord {
  return buildRouteQuery(query);
}

export interface NavTitleRouteQueryInput {
  navTitle?: RouteQueryValue;
}

/** 通用页面标题 hash query，用于 H5 hash 回跳等场景。 */
export function buildNavTitleQuery(title: string): RouteQueryRecord {
  return buildRouteQuery({ navTitle: title });
}
