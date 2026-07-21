import request from '@/utils/http'

/** 工单类型 */
export type OrderType = 'FEEDBACK' | 'BUG' | 'SUGGESTION' | 'SUPPORT'

/** 工单优先级 */
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

/** 工单状态 */
export type OrderStatus = 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED'

/** 工单 */
export interface WorkOrder {
  id: number
  tenantId: number
  title: string
  content?: string
  orderType: OrderType
  priority: Priority
  status: OrderStatus
  creatorId?: number
  assigneeId?: number
  resolvedAt?: string
  closedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

/** 创建工单 DTO */
export interface CreateWorkOrderDto {
  title: string
  content?: string
  orderType?: OrderType
  priority?: Priority
  status?: OrderStatus
  creatorId?: number
  assigneeId?: number
  resolvedAt?: string
  closedAt?: string
  remark?: string
}

/** 更新工单 DTO */
export type UpdateWorkOrderDto = Partial<CreateWorkOrderDto>

/** 工单查询参数 */
export interface WorkOrderQueryDto {
  keyword?: string
  title?: string
  tenantId?: number
  orderType?: OrderType
  priority?: Priority
  status?: OrderStatus
  creatorId?: number
  assigneeId?: number
  page?: number
  size?: number
}

/** 工单列表返回 */
export interface WorkOrderListResult {
  list: WorkOrder[]
  total: number
}

/** 获取工单列表 */
export function fetchWorkOrderList(params: WorkOrderQueryDto) {
  return request.get<WorkOrderListResult>('/work-order/list', { params })
}

/** 获取工单详情 */
export function fetchWorkOrderDetail(id: number) {
  return request.get<WorkOrder>(`/work-order/${id}`)
}

/** 创建工单 */
export function fetchCreateWorkOrder(data: CreateWorkOrderDto) {
  return request.post<WorkOrder>('/work-order', data)
}

/** 更新工单 */
export function fetchUpdateWorkOrder(id: number, data: UpdateWorkOrderDto) {
  return request.post<WorkOrder>(`/work-order/${id}`, data)
}

/** 删除工单 */
export function fetchDeleteWorkOrder(id: number) {
  return request.post(`/work-order/${id}/delete`)
}
