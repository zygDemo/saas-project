export interface PawnMaterialFile {
  name: string;
  path: string;
  size?: number;
  type?: string;
  createTime: string;
}

export interface PawnMaterialItem {
  code: string;
  label: string;
  required: boolean;
  accept: "image" | "video" | "file";
  files: PawnMaterialFile[];
}

export interface PawnLoanInfo {
  loanAmount: number | string;
  monthlyRate: number | string;
  parkingFee: number | string;
  vehicleStatus: string;
  garage: string;
  storeName: string;
  ownerName: string;
  deposit: number | string;
  remark: string;
}

export interface PawnCustomerInfo {
  personName?: string;
  telephone?: string;
  personIdcard?: string;
  gender?: number | string;
  race?: string;
  personAddress?: string;
  personIssuingAuthority?: string;
  personValidDateStart?: string;
  personValidDateEnd?: string;
}

export interface PawnVehicleInfo {
  plateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleOwner?: string;
  address?: string;
  usageNature?: string;
  sealInfo?: string;
  engineNumber?: string;
  registerDate?: string;
  vehicleCode?: string;
  mileage?: string;
}

export interface PawnApprovalInfo {
  customerType: string;
  paymentMethod: string;
  approvalRemark: string;
}

export interface PawnRepaymentPlanItem {
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  parkingFee: number;
  monthlyPayment: number;
}

export interface PawnApplication {
  id: string;
  customerName: string;
  phone: string;
  plateNumber: string;
  vehicleModel: string;
  customerInfo?: PawnCustomerInfo;
  vehicleInfo?: PawnVehicleInfo;
  loanInfo: PawnLoanInfo;
  materials: PawnMaterialItem[];
  status: "pending" | "approved";
  createTime: string;
  loanTime?: string;
  approvalInfo?: PawnApprovalInfo;
  repaymentPlan?: PawnRepaymentPlanItem[];
}

const STORAGE_KEY = "pawn-applications";

export const pawnMaterialTemplates = [
  { code: "traffic_violation", label: "交管12123未处理违章截图", required: false, accept: "image" },
  { code: "vehicle_status", label: "交管12123车辆状态截图", required: false, accept: "image" },
  { code: "my_info", label: "交管12123我的信息截图", required: false, accept: "image" },
  { code: "inspection_mark", label: "年检标志", required: false, accept: "image" },
  { code: "contract_photo", label: "典当合同合影", required: true, accept: "image" },
  { code: "car_owner_photo", label: "人车合影", required: true, accept: "image" },
  { code: "inspection_video", label: "验车视频", required: true, accept: "video" },
  { code: "transfer_auth_video", label: "过户视频授权", required: false, accept: "video" },
  { code: "registration_certificate", label: "登记证书照片", required: false, accept: "image" },
  { code: "non_owner_auth_video", label: "非本人车主视频授权", required: false, accept: "video" },
  { code: "maintenance_record", label: "维保记录", required: false, accept: "file" },
] as const;

export function createEmptyPawnMaterials(): PawnMaterialItem[] {
  return pawnMaterialTemplates.map((item) => ({
    ...item,
    files: [],
  }));
}

export function getPawnApplications(): PawnApplication[] {
  const raw = uni.getStorageSync(STORAGE_KEY);
  if (!raw) return [];

  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPawnApplications(list: PawnApplication[]) {
  uni.setStorageSync(STORAGE_KEY, list);
}

export function upsertPawnApplication(application: PawnApplication) {
  const list = getPawnApplications();
  const index = list.findIndex((item) => item.id === application.id);
  if (index >= 0) {
    list[index] = application;
  } else {
    list.unshift(application);
  }
  setPawnApplications(list);
}

export function getPawnApplication(id: string) {
  return getPawnApplications().find((item) => item.id === id) || null;
}

export function formatMoney(value: number | string) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
}

export function getNowText() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createPawnRepaymentPlan(loanInfo: PawnLoanInfo): PawnRepaymentPlanItem[] {
  const amount = Number(loanInfo.loanAmount || 0);
  const monthlyRate = Number(loanInfo.monthlyRate || 0);
  const parkingFee = Number(loanInfo.parkingFee || 0);
  const interest = amount * monthlyRate / 100;
  const monthlyPayment = interest + parkingFee;
  const start = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + index + 1);
    const pad = (value: number) => String(value).padStart(2, "0");

    return {
      period: index + 1,
      dueDate: `${dueDate.getFullYear()}-${pad(dueDate.getMonth() + 1)}-${pad(dueDate.getDate())}`,
      principal: 0,
      interest,
      parkingFee,
      monthlyPayment,
    };
  });
}

export function getDefaultPawnApplications(): PawnApplication[] {
  const materials = createEmptyPawnMaterials().map((item, index) => ({
    ...item,
    files: item.required
      ? [{
          name: `${item.label}.jpg`,
          path: "",
          size: 0,
          type: item.accept,
          createTime: "2026-05-20 09:30",
        }]
      : index < 2
        ? [{
            name: `${item.label}.jpg`,
            path: "",
            size: 0,
            type: item.accept,
            createTime: "2026-05-20 09:30",
          }]
        : [],
  }));

  const firstLoanInfo = {
    loanAmount: 80000,
    monthlyRate: 2.5,
    parkingFee: 600,
    vehicleStatus: "全款",
    garage: "义乌",
    storeName: "义乌城西店",
    ownerName: "陈经理",
    deposit: 2000,
    remark: "客户急用款，资料已核验。",
  };

  return [
    {
      id: "PAWN20260520001",
      customerName: "周明",
      phone: "13800008888",
      plateNumber: "浙G8K21Q",
      vehicleModel: "奥迪 A6L 2021款",
      customerInfo: {
        personName: "周明",
        telephone: "13800008888",
        personIdcard: "330782199203150814",
        gender: 1,
        race: "汉族",
        personAddress: "浙江省义乌市稠城街道宾王路88号",
        personIssuingAuthority: "义乌市公安局",
        personValidDateStart: "2018-06-01",
        personValidDateEnd: "2038-06-01",
      },
      vehicleInfo: {
        plateNumber: "浙G8K21Q",
        vehicleBrand: "奥迪",
        vehicleModel: "奥迪 A6L 2021款",
        vehicleOwner: "周明",
        address: "浙江省义乌市稠城街道宾王路88号",
        usageNature: "非营运",
        sealInfo: "浙交警",
        engineNumber: "EA88820210588",
        registerDate: "2021-03-15",
        vehicleCode: "LFV3A24K6M3123456",
        mileage: "42800",
      },
      loanInfo: firstLoanInfo,
      materials,
      status: "pending",
      createTime: "2026-05-20 09:30",
    },
    {
      id: "PAWN20260518002",
      customerName: "林晓",
      phone: "13900006666",
      plateNumber: "浙C2M78N",
      vehicleModel: "宝马 3系 2020款",
      customerInfo: {
        personName: "林晓",
        telephone: "13900006666",
        personIdcard: "330302199511087226",
        gender: 2,
        race: "汉族",
        personAddress: "浙江省温州市鹿城区车站大道166号",
        personIssuingAuthority: "温州市公安局鹿城分局",
        personValidDateStart: "2017-05-18",
        personValidDateEnd: "2037-05-18",
      },
      vehicleInfo: {
        plateNumber: "浙C2M78N",
        vehicleBrand: "宝马",
        vehicleModel: "宝马 3系 2020款",
        vehicleOwner: "林晓",
        address: "浙江省温州市鹿城区车站大道166号",
        usageNature: "非营运",
        sealInfo: "浙交警",
        engineNumber: "B4820209988",
        registerDate: "2020-11-08",
        vehicleCode: "WBA5R7104LF987654",
        mileage: "36500",
      },
      loanInfo: {
        loanAmount: 65000,
        monthlyRate: 2.2,
        parkingFee: 500,
        vehicleStatus: "抵押",
        garage: "温州",
        storeName: "温州鹿城店",
        ownerName: "王经理",
        deposit: 2000,
        remark: "需关注抵押状态。",
      },
      materials,
      status: "approved",
      createTime: "2026-05-18 14:15",
      loanTime: "2026-05-18 16:40",
      approvalInfo: {
        customerType: "外部",
        paymentMethod: "银行卡",
        approvalRemark: "资料齐全，已放款。",
      },
      repaymentPlan: createPawnRepaymentPlan({
        loanAmount: 65000,
        monthlyRate: 2.2,
        parkingFee: 500,
        vehicleStatus: "抵押",
        garage: "温州",
        storeName: "温州鹿城店",
        ownerName: "王经理",
        deposit: 2000,
        remark: "",
      }),
    },
  ];
}
