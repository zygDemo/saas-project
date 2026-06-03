import { http } from "uview-pro";
import {
  uploadFile as uploadByUni,
  uploadFileWithData,
} from "@/common/http.interceptor";

/** API 通用响应包装 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
  rows?: T;
  total?: number;
}

export interface PageResult<T = unknown> {
  records?: T[];
  rows?: T[];
  current?: number;
  pageNum?: number;
  size?: number;
  pageSize?: number;
  total?: number;
}

export interface MobileUploadResult {
  id?: number;
  url?: string;
  fileUrl?: string;
  previewUrl?: string;
  rawUrl?: string;
  objectKey?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileCode?: string;
}

export interface MobileFileQuery {
  uuid?: string;
  creditOrderId?: string;
  fileType?: string;
  categoryCode?: string;
  businessType?: string;
  businessId?: string | number;
}

export interface CreditApplyData {
  uuid: string;
  creditOrderId?: string;
  amount: number;
  periods: number;
  businessType?: string;
  orderType?: string;
  remark?: string;
  parkingFee?: number;
  vehicleStatus?: string;
  garage?: string;
  storeName?: string;
  ownerName?: string;
  deposit?: number;
}

export interface CreditListItem {
  id?: number;
  tenantId?: number;
  orgId?: number;
  orgName?: string;
  customerId?: number;
  uuid?: string;
  creditOrderId?: string;
  applicationNo?: string;
  orderNo?: string;
  customerName?: string;
  personName?: string;
  name?: string;
  phone?: string;
  telephone?: string;
  idCard?: string;
  vehicleId?: number;
  plateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleOwner?: string;
  amount?: string | number;
  term?: string | number;
  rate?: string | number;
  approvedAmount?: string | number;
  approvedTerm?: string | number;
  approvedRate?: string | number;
  status?: string | number;
  businessType?: string;
  businessNode?: string | number;
  currentNode?: string | number;
  nodeCode?: string | number;
  currentNodeName?: string;
  nodeName?: string;
  currentStatus?: string | number;
  nodeStatus?: string | number;
  currentStatusName?: string;
  nodeStatusName?: string;
  phaseCode?: string | number;
  phaseName?: string;
  productName?: string;
  funderName?: string;
  periods?: string | number;
  pushQuota?: string | number;
  isSignContract?: number;
  isFaceRecognition?: number;
  createTime?: string;
  updateTime?: string;
  createdAt?: string;
  updatedAt?: string;
  applicationId?: number;
}

export interface StatisticsOverview {
  todayLeads?: number;
  todayApplications?: number;
  pendingSupplement?: number;
  pendingSigning?: number;
  pendingApproval?: number;
  monthLoanAmount?: number;
  approvalRate?: string | number;
  leadCount?: number;
  entryCount?: number;
  loanCount?: number;
  loanAmount?: number;
}

/** 贷款业务节点枚举 */
export interface LoanBusinessNode {
  /** 编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
}

/** 联系人信息（单条） */
export interface ContactInfo {
  /** 主键id */
  id?: number;
  /** 客户唯一编码 */
  userUuid: string;
  /** 联系人类型 1：共借人；2：配偶；3：配偶且共借人；4：担保人 */
  contactType?: number;
  /** 联系人姓名 */
  contactName?: string;
  /** 联系方式 */
  contactTelephone?: string;
  /** 身份证号码 */
  contactIdcard?: string;
  /** 与客户关系 1配偶 2父母 3子女 4朋友 5兄弟姐妹 6亲戚 7同事 8其他 */
  contactRelationship?: number;
}

/** 进件用户基础信息 */
export interface IdCardInfo {
  /** 主键 */
  id?: number;
  /** 客户唯一编码 */
  uuid?: string;
  /** 业务员id */
  salesmanId?: number;
  /** 是否同步创建订单草稿 */
  createOrder?: boolean;
  /** 业务类型 */
  businessType?: string;
  /** 订单ID */
  applicationId?: number;
  /** 订单号 */
  creditOrderId?: string;
  /** 手机号码 */
  telephone?: string;
  /** 是否推送授信 1：已推送；2：未推送 */
  isPushCredit?: number;
  /** 身份证照片-正 */
  idcardFront?: string;
  /** 身份证照片-反 */
  idcardBack?: string;
  /** 姓名 */
  personName?: string;
  /** 性别 1：男；2：女 */
  gender?: number;
  /** 年龄 */
  age?: number;
  /** 身份证号码 */
  personIdcard?: string;
  /** 身份证地址 */
  personAddress?: string;
  /** 身份证有效起始日期 */
  personValidDateStart?: string;
  /** 身份证有效结束日期 */
  personValidDateEnd?: string;
  /** 身份认证状态, 1:成功,2:失败,3补齐资料,其他是未认证 */
  personValid?: number;
  /** 发证机关 */
  personIssuingAuthority?: string;
  /** 职业类型 */
  personOccupation?: string;
  /** 居住状况 */
  dwellingCondition?: string;
  /** 学位 1：名誉博士；2：博士；3：硕士；4：学士；5：无；9：未知 */
  degree?: string;
  /** 学历 */
  education?: string;
  /** 婚姻状况 */
  marriage?: string;
  /** 客户收入(单位分) */
  personIncome?: number;
  /** 联系人姓名(亲属) */
  personContactsName?: string;
  /** 与客户关系(亲属) */
  personContactsRelationship?: string;
  /** 联系方式(亲属) */
  personContactsTelephone?: string;
  /** 联系人身份证(亲属) */
  personContactsIdcard?: string;
  /** 联系人姓名(其他) */
  relationContactsName?: string;
  /** 联系方式(其他) */
  relationContactsTelephone?: string;
  /** 与客户关系(其他) */
  relationContactsRelationship?: string;
  /** 联系人身份证(其他) */
  relationContactsIdcard?: string;
  /** 职业 */
  profession?: string;
  /** 审批结果， 1:待审批，2:审批通过，3：审批不通过；4：其他 */
  approval?: number;
  /** 审批备注说明 */
  approvalNotes?: string;
  /** 民族 */
  race?: string;
  /** 是否签约合同 1：已签约；2：未签约 */
  isContract?: number;
  /** 公司单位名称 */
  workingName?: string;
  /** 公司电话 */
  workingTelephone?: string;
  /** 公司地址 */
  workingAddress?: string;
  /** 公司详细地址 */
  workingDetailedAddress?: string;
  /** 居住地址 */
  liveAddress?: string;
  /** 居住详细地址 */
  liveDetailedAddress?: string;
  /** 常驻地址 */
  permanentAddress?: string;
  /** 供养子女数 */
  childrenNum?: number;
  /** 扩展参数 */
  params?: Record<string, unknown>;
}

/** 用户车辆认证信息 */
export interface VehicleInfo {
  /** 主键 */
  id?: number;
  /** 关联的用户uuid */
  uuid?: string;
  /** 车辆行驶证证件照片 */
  vehicleImgUrl?: string;
  /** 购买方式：1-全款 2-按揭 */
  purchaseType?: number;
  /** 车辆品牌 */
  vehicleBrand?: string;
  /** 车辆车牌号码 */
  plateNumber?: string;
  /** 车型 */
  vehicleModel?: string;
  /** 所属人姓名 */
  vehicleOwner?: string;
  /** 购买日期 */
  purchaseDate?: string;
  /** 购买金额(单位分) */
  purchasePrice?: number;
  /** 贷款金额(单位分) */
  loanAmount?: number;
  /** 贷款期限(单位年) */
  loanTerm?: number;
  /** 月还款金额(单位分) */
  monthlyPayment?: number;
  /** 车辆识别代码 */
  vehicleCode?: string;
  /** 车辆发动机号 */
  engineNumber?: string;
  /** 车辆注册日期 */
  registerDate?: string;
  /** 车辆行驶里程 */
  mileage?: string;
  /** 人车视频 */
  vehicleVideoUrl?: string;
  /** 住址 */
  address?: string;
  /** 使用性质 */
  usageNature?: string;
  /** 印章信息 */
  sealInfo?: string;
  /** 燃油类型 1：油车；2：纯电；3：油电混合 */
  fuelType?: number;
  /** 车辆颜色 */
  vehicleColor?: string;
  /** 是否发生故障 1：发生故障；2：未发生故障 */
  isFault?: number;
  /** 是否进行抵押 1：是；2：否 */
  isMortgage?: number;
  /** 是否购买商业保险 1：是；2：否 */
  isInsurance?: number;
  /** 保险到期日 */
  insuranceExpirationDate?: string;
}

/** 销售线索新增参数 */
export interface SalesLeadData {
  /** 客户姓名 */
  customerName: string;
  /** 手机号 */
  phone: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 贷款金额 */
  loanAmount: number;
  /** 业务员ID */
  salesmanId?: number;
}

/** 线索跟进参数 */
export interface ClueFollowUpData {
  /** 主键 */
  id?: number;
  /** 关联进件用户表uuid */
  uuid: string;
  /** 业务员id */
  salesmanId?: number;
  /** 客户最新联系状态 1停机 2无法联系 3暂时失联 4不接电话 5正常联系 6彻底失联 */
  contactStatus: number;
  /** 备注说明 */
  remarks?: string;
  /** 是否有效 1：有效；2：无效 */
  status?: number;
}

export interface ContractSignStartResult {
  callbackUrl?: string;
  creditOrderId?: string;
  customerId?: string;
  fileList?: unknown[] | null;
  flowId?: string;
  id?: number;
  signUrl?: string;
  status?: string;
  uuid?: string;
  willTypes?: unknown[] | null;
}

export interface VehiclePriceQueryParams {
  carNo?: string;
  mile?: string | number;
  modelId?: string | number;
  regDate?: string;
  vin?: string;
}

export function useBusinessApi() {
  return {
    /** 身份证信息保存 */
    addOrUpdateUserBasic: (data: IdCardInfo) =>
      http.post<ApiResponse<IdCardInfo>>("/m/user/addOrUpdateUserBasic", data),
    /** 联系人信息保存（uuid 通过 URL 参数传递） */
    addOrUpdateContact: (data: ContactInfo) =>
      http.post(`/m/user/addOrUpdateContact`, data),
    /** 获取联系人列表 */
    getContacts: (userUuid: string) =>
      http.get("/m/user/getContacts", { userUuid }),
    /** 删除联系人 */
    deleteContact: (id: number) => http.delete(`/m/user/deleteContact/${id}`),
    /** 创建/更新身份证信息 */
    addOrUpdateIdCardInfo: (data: IdCardInfo) =>
      http.post<ApiResponse<IdCardInfo>>("/m/user/addOrUpdateIdCardInfo", data),
    /** 获取身份证信息 */
    getIdCardInfo: () => http.post<ApiResponse<IdCardInfo | null>>("/m/user/getIdCardInfo"),
    /** 创建/更新车辆信息 */
    addOrUpdateVehicle: (data: VehicleInfo) =>
      http.post<ApiResponse<VehicleInfo>>(
        "/m/vehicle/addOrUpdateVehicle",
        data,
      ),
    /** 文件上传（支持文件路径） */
    uploadFile: (filePath: string) => uploadByUni(filePath, "/m/file/upload") as Promise<ApiResponse<MobileUploadResult> & MobileUploadResult>,
    /** 图片上传（支持文件路径）统一走 /m/file/upload */
    uploadImage: (filePath: string) => uploadByUni(filePath, "/m/file/upload") as Promise<ApiResponse<MobileUploadResult> & MobileUploadResult>,
    /** 带类型参数的文件上传 */
    uploadWithType: (filePath: string, formData: Record<string, string>) =>
      uploadFileWithData(filePath, "/m/file/uploadWithType", formData) as Promise<ApiResponse<MobileUploadResult> & MobileUploadResult>,
    /** 兼容旧调用：文件记录已在 /m/file/uploadWithType 上传时保存 */
    saveFiles: (data: {
      uuid: string;
      fileType: string;
      creditOrderId: string;
      files: Array<{
        objectKey: string;
        fileName?: string;
        fileSize?: number;
        fileCode?: string;
      }>;
    }) => Promise.resolve({
      code: 200,
      msg: "success",
      data: data.files,
    } as ApiResponse<typeof data.files>),
    /** 兼容旧调用：按授信申请获取文件列表 */
    getCreditFileList: (params: { uuid: string; creditOrderId: string }) =>
      http.get<ApiResponse<MobileUploadResult[]>>("/m/file/getFileList", params),
    /** 兼容旧调用：当前接口清单未提供状态推进，返回订单详情保持页面流程可继续 */
    submitInitialAudit: (creditOrderId: string) =>
      http.get(`/m/credit/getCreditDetailByOrderId/${creditOrderId}`),
    /** 兼容旧调用：当前接口清单未提供状态推进，返回订单详情保持页面流程可继续 */
    completeFileSupplement: (creditOrderId: string) =>
      http.get(`/m/credit/getCreditDetailByOrderId/${creditOrderId}`),
    /** 兼容旧调用：当前接口清单未提供状态推进，返回订单详情保持页面流程可继续 */
    submitPreAudit: (creditOrderId: string) =>
      http.get(`/m/credit/getCreditDetailByOrderId/${creditOrderId}`),
    /** 获取文件列表 */
    getFileList: (params?: string | MobileFileQuery) =>
      http.get<ApiResponse<MobileUploadResult[]>>(
        "/m/file/getFileList",
        typeof params === "string" ? { uuid: params } : params,
      ),
    /** 按文件类型获取文件列表 */
    getFileListByType: (params: MobileFileQuery & { fileType: string }) =>
      http.get<ApiResponse<MobileUploadResult[]>>("/m/file/getFileListByType", params),
    /** 删除文件 */
    deleteFile: (id: number) => http.delete<ApiResponse<{ id: number }>>(`/m/file/deleteFile/${id}`),
    /** 获取产品文件清单 */
    getProductFileList: (params?: Record<string, unknown>) =>
      http.get<ApiResponse<unknown[]>>("/m/file/getProductFileList", params),
    /** 根据业务员ID获取授信申请列表（进件列表） */
    getCreditList: (params: Record<string, unknown>) =>
      http.get<ApiResponse<CreditListItem[]>>("/m/credit/getCreditList", params),
    /** 获取订单列表（新流程节点版） */
    getOrderList: (params: Record<string, unknown>) =>
      http.get<ApiResponse<PageResult<CreditListItem>>>(
        "/application/order-list",
        params,
      ),
    /** 获取待补充资料列表 */
    getSupplementList: (params: Record<string, unknown>) =>
      http.get("/m/credit/getSupplementList", params),
    /** 获取授信申请详情（编辑也用） */
    getCreditDetail: (id: number | string) =>
      http.get<ApiResponse<CreditListItem>>(`/m/credit/getCreditDetail/${id}`),
    /** 根据授信申请编号获取详情 */
    getCreditDetailByOrderId: (creditOrderId: string) =>
      http.get<ApiResponse<CreditListItem>>(`/m/credit/getCreditDetailByOrderId/${creditOrderId}`),
    /** 提交授信申请 */
    creditApply: (data: CreditApplyData) =>
      http.post<ApiResponse<CreditListItem>>("/m/credit/apply", data),
    /** 修改授信申请 */
    updateCredit: (data: Record<string, unknown>) =>
      http.post<ApiResponse<CreditListItem>>("/m/credit/update", data),
    /** 获取产品列表 */
    getProductList: () => http.get("/m/product/getProductList"),
    /** 获取客户身份信息详情 */
    getUserBasic: (uuid: string) =>
      http.get<ApiResponse<IdCardInfo>>("/m/user/getUserBasic", { uuid }),
    /** 获取客户车辆信息详情 */
    getVehicleInfo: (uuid: string) =>
      http.get<ApiResponse<VehicleInfo>>("/m/vehicle/getVehicleInfo", { uuid }),
    /** 身份证OCR识别 */
    getIdCardOcr: (objectKey: string, side?: "front" | "back") =>
      http.post("/m/user/getIdCardOcr", { objectKey, side }),
    /** 车辆行驶证OCR识别 */
    getVehicleOcr: (objectKey: string) =>
      http.post<ApiResponse<null>>("/m/vehicle/getVehicleOcr", { objectKey }),
    /** 根据车架号(VIN)获取车型详细信息 */
    requestVehicleModel: (vin: string) =>
      http.post<ApiResponse<Record<string, unknown>>>(
        "/m/vehicleModel/requestVehicleModel",
        { vin },
      ),

    /** 查询车辆评估价格 */
    getVehiclePriceByVin: (params: VehiclePriceQueryParams) =>
      http.post<ApiResponse<Record<string, unknown>>>(
        "/m/vehicle300/Vehicle300",
        params,
      ),

    /** 字典数据列表查询 */
    getDictDataList: (dictType: string) =>
      http.get(`/m/dict/data/type/${dictType}`),
    /** 贷款业务节点枚举查询 */
    getLoanBusinessNodes: () =>
      http.get<ApiResponse<LoanBusinessNode[]>>("/m/enum/loanBusinessNodes"),
    /** 获取线索列表（dataSource=2，支持客户姓名模糊查询） */
    getUserList: (params: { dataSource?: number; personName?: string }) =>
      http.get<ApiResponse<IdCardInfo[]>>("/m/user/getUserList", params),

    /** 新增销售线索 */
    addSalesLead: (data: SalesLeadData) => http.post("/m/salesLead/add", data),

    // ========== 线索跟进 ==========

    /** 新增跟进记录 */
    addClueFollowUp: (data: ClueFollowUpData) =>
      http.post("/m/clueFollowUp/add", data),

    /** 获取跟进列表 */
    getClueFollowUpList: (uuid: string) =>
      http.get(`/m/clueFollowUp/list/${uuid}`),

    // ========== 三方签约（视频面签）==========

    /** 发起人脸识别 */
    startFaceSign: (data: { uuid: string; redirectUrl?: string }) =>
      http.post("/m/signing/face/start", data),
    /** 发起授权书签署 */
    startAuthContractSign: (data: {
      uuid: string;
      redirectUrl?: string;
      creditOrderId?: string;
    }) =>
      http.post<ApiResponse<ContractSignStartResult>>(
        "/m/signing/contract/start",
        data,
      ),

    /** 发起合同签署 */
    startContractSign: (data: {
      uuid: string;
      redirectUrl?: string;
      creditOrderId?: string;
    }) =>
      http.post<ApiResponse<ContractSignStartResult>>(
        // "/m/signing/contract/start",//旧接口
        "/m/signing/loan/start",
        data,
      ),

    /** 获取人脸识别结果 */
    getFaceSignDetail: (creditOrderId: string) =>
      http.get(`/m/signing/face/detail/${creditOrderId}`),

    /** 获取授权书签约文件列表（授权书签署完成后同步调用） */
    getAuthContractDetail: (creditOrderId: string) =>
      http.get(`/m/signing/contract/detail/${creditOrderId}`),

    /** 获取合同签约文件列表（合同签署完成后同步调用） */
    getContractDetail: (creditOrderId: string) =>
      http.get(`/m/signing/loan/detail/${creditOrderId}`),

    // ========== 统计 ==========

    /** 业务统计概览 */
    getStatisticsOverview: () =>
      http.get<ApiResponse<StatisticsOverview>>("/m/statistics/overview"),
  };
}
