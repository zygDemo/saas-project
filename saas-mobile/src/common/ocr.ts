/**
 * OCR 工具模块：通过后端 OCR 接口识别，避免前端加载 tesseract 语言模型。
 */
import { uploadFileWithData } from "@/common/http.interceptor";
import { compressImageForOcr } from "@/common/image-compress";

/** 身份证人像面 OCR 结果 */
export interface IdCardFrontResult {
  name: string;
  gender: string;
  nation: string;
  race: string;
  birth: string;
  address: string;
  idNum: string;
}

/** 身份证国徽面 OCR 结果 */
export interface IdCardBackResult {
  authority: string;
  validDate: string;
  validDateStart: string;
  validDateEnd: string;
}

/** 行驶证 OCR 结果 */
export interface VehicleOcrResult {
  plateNumber: string;
  vehicleType: string;
  owner: string;
  address: string;
  useCharacter: string;
  model: string;
  vin: string;
  engineNumber: string;
  registerDate: string;
  issueDate: string;
  sealInfo: string;
}

interface OcrApiResponse<TFields = Record<string, unknown>, TParsed = unknown> {
  code?: number;
  msg?: string;
  data?: {
    success?: boolean;
    text?: string;
    fields?: TFields;
    parsed?: TParsed;
  };
}

interface IdCardParsed {
  side?: "front" | "back";
  front?: Partial<IdCardFrontResult>;
  back?: Partial<IdCardBackResult>;
}

interface IdCardFields {
  personName?: string;
  personIdcard?: string;
  gender?: number | string;
  race?: string;
  birth?: string;
  personAddress?: string;
  personIssuingAuthority?: string;
  personValidDateStart?: string;
  personValidDateEnd?: string;
}

interface VehicleFields {
  plateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleOwner?: string;
  address?: string;
  usageNature?: string;
  engineNumber?: string;
  registerDate?: string;
  vehicleCode?: string;
  sealInfo?: string;
}

interface RecognizeOptions {
  compress?: boolean;
}

function unwrapOcrData<TFields, TParsed>(response: OcrApiResponse<TFields, TParsed>) {
  if (response?.code !== 200 || !response.data) {
    throw new Error(response?.msg || "OCR 识别失败");
  }
  return response.data;
}

function showOcrLoading() {
  uni.showLoading({
    title: "OCR识别中...",
    mask: true,
  });
}

function hideOcrLoading() {
  uni.hideLoading();
}

function genderToText(value: unknown) {
  if (value === 1 || value === "1") return "男";
  if (value === 2 || value === "2") return "女";
  return typeof value === "string" ? value : "";
}

function buildValidDate(start?: string, end?: string) {
  if (!start && !end) return "";
  if (!start) return end || "";
  if (!end) return start;
  return `${start}-${end}`;
}

function mapIdCardFront(parsed: IdCardParsed, fields: IdCardFields): IdCardFrontResult {
  const front = parsed.front || {};
  return {
    name: fields.personName || front.name || "",
    gender: genderToText(fields.gender) || genderToText(front.gender) || front.gender || "",
    nation: front.nation || "",
    race: fields.race || "",
    birth: fields.birth || front.birth || "",
    address: fields.personAddress || front.address || "",
    idNum: fields.personIdcard || front.idNum || "",
  };
}

function mapIdCardBack(parsed: IdCardParsed, fields: IdCardFields): IdCardBackResult {
  const back = parsed.back || {};
  const validDateStart = fields.personValidDateStart || "";
  const validDateEnd = fields.personValidDateEnd || "";
  return {
    authority: fields.personIssuingAuthority || back.authority || "",
    validDateStart,
    validDateEnd,
    validDate:
      back.validDate ||
      (validDateStart || validDateEnd ? `${validDateStart}至${validDateEnd}` : "") ||
      "",
  };
}

function mapVehicle(parsed: Partial<VehicleOcrResult>, fields: VehicleFields): VehicleOcrResult {
  return {
    plateNumber: fields.plateNumber || parsed.plateNumber || "",
    vehicleType: fields.vehicleBrand || parsed.vehicleType || "",
    owner: fields.vehicleOwner || parsed.owner || "",
    address: fields.address || parsed.address || "",
    useCharacter: fields.usageNature || parsed.useCharacter || "",
    model: fields.vehicleModel || parsed.model || "",
    vin: fields.vehicleCode || parsed.vin || "",
    engineNumber: fields.engineNumber || parsed.engineNumber || "",
    registerDate: fields.registerDate || parsed.registerDate || "",
    issueDate: parsed.issueDate || "",
    sealInfo: fields.sealInfo || parsed.sealInfo || "",
  };
}

async function resolveOcrImagePath(imagePath: string, options?: RecognizeOptions) {
  if (options?.compress === false) return imagePath;
  return compressImageForOcr(imagePath);
}

/**
 * 身份证 OCR 识别。
 */
export async function recognizeIdCard(
  imagePath: string,
  side: "front" | "back",
  options?: RecognizeOptions,
): Promise<IdCardFrontResult | IdCardBackResult | null> {
  showOcrLoading();
  try {
    const ocrImagePath = await resolveOcrImagePath(imagePath, options);
    const response = await uploadFileWithData(ocrImagePath, "/m/user/getIdCardOcr", { side });
    const data = unwrapOcrData<IdCardFields, IdCardParsed>(response);
    const parsed = data.parsed || {};
    const fields = data.fields || {};

    return side === "front"
      ? mapIdCardFront(parsed, fields)
      : mapIdCardBack(parsed, fields);
  } catch (error) {
    console.error("[OCR] 身份证识别失败:", error);
    return null;
  } finally {
    hideOcrLoading();
  }
}

/**
 * 行驶证 OCR 识别。
 */
export async function recognizeVehicle(
  imagePath: string,
  options?: RecognizeOptions,
): Promise<VehicleOcrResult | null> {
  showOcrLoading();
  try {
    const ocrImagePath = await resolveOcrImagePath(imagePath, options);
    const response = await uploadFileWithData(ocrImagePath, "/m/vehicle/getVehicleOcr", {});
    const data = unwrapOcrData<VehicleFields, Partial<VehicleOcrResult>>(response);
    return mapVehicle(data.parsed || {}, data.fields || {});
  } catch (error) {
    console.error("[OCR] 行驶证识别失败:", error);
    return null;
  } finally {
    hideOcrLoading();
  }
}

/**
 * 兼容旧调用；后端 OCR 不需要前端释放 Worker。
 */
export async function terminateOcrWorker(): Promise<void> {
  await Promise.resolve();
}
