/**
 * OCR 工具模块 — 基于 tesseract.js 本地识别
 * 仅 H5 环境可用（Web Worker + WASM）
 */
// #ifdef H5
import { createWorker } from 'tesseract.js';
// #endif

/** 身份证人像面 OCR 结果 */
export interface IdCardFrontResult {
  name: string;
  gender: string;      // "男" | "女"
  nation: string;      // 如 "汉"
  birth: string;       // yyyy-MM-dd
  address: string;
  idNum: string;
}

/** 身份证国徽面 OCR 结果 */
export interface IdCardBackResult {
  authority: string;   // 签发机关
  validDate: string;   // 如 "2020.01.01-2030.01.01" 或 "2020.01.01-长期"
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
}

// ===== ID Card Parsing =====

/** 解析身份证人像面 OCR 文本 */
function parseIdCardFront(raw: string): IdCardFrontResult {
  const result: IdCardFrontResult = {
    name: '',
    gender: '',
    nation: '',
    birth: '',
    address: '',
    idNum: '',
  };

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // 姓名
    const nameMatch = line.match(/姓名[：:\s]*([^\s]{2,4})/);
    if (nameMatch) { result.name = nameMatch[1]; continue; }

    // 性别
    const genderMatch = line.match(/性别[：:\s]*(男|女)/);
    if (genderMatch) { result.gender = genderMatch[1]; continue; }

    // 民族
    const nationMatch = line.match(/民族[：:\s]*(\S{1,4})/);
    if (nationMatch) { result.nation = nationMatch[1]; continue; }

    // 出生日期
    const birthMatch = line.match(/(?:出生|生日)[：:\s]*(\d{4})\D*(\d{1,2})\D*(\d{1,2})/);
    if (birthMatch) {
      const m = birthMatch[2].padStart(2, '0');
      const d = birthMatch[3].padStart(2, '0');
      result.birth = `${birthMatch[1]}-${m}-${d}`;
      continue;
    }

    // 住址
    const addrMatch = line.match(/(?:住址|地址)[：:\s]*(.+)/);
    if (addrMatch) { result.address = addrMatch[1]; continue; }

    // 身份证号（18位）
    const idMatch = line.match(/(?:公民身份号码|身份证号|身份证)[：:\s]*(\d{17}[\dXx])/);
    if (idMatch) { result.idNum = idMatch[1].toUpperCase(); continue; }

    // 兜底：纯 18 位数字+X
    const pureIdMatch = line.match(/^(\d{17}[\dXx])$/);
    if (pureIdMatch) { result.idNum = pureIdMatch[1].toUpperCase(); continue; }
  }

  return result;
}

/** 解析身份证国徽面 OCR 文本 */
function parseIdCardBack(raw: string): IdCardBackResult {
  const result: IdCardBackResult = { authority: '', validDate: '' };
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const authMatch = line.match(/(?:签发机关|发证机关)[：:\s]*(.+)/);
    if (authMatch) { result.authority = authMatch[1]; continue; }

    const validMatch = line.match(/(?:有效期限|有效期)[：:\s]*(.+)/);
    if (validMatch) { result.validDate = validMatch[1]; continue; }
  }

  return result;
}

// ===== Vehicle License Parsing =====

/** 解析行驶证 OCR 文本 */
function parseVehicleOcr(raw: string): VehicleOcrResult {
  const result: VehicleOcrResult = {
    plateNumber: '',
    vehicleType: '',
    owner: '',
    address: '',
    useCharacter: '',
    model: '',
    vin: '',
    engineNumber: '',
    registerDate: '',
    issueDate: '',
  };

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const plate = line.match(/(?:号牌号码|车牌号)[：:\s]*([A-Z0-9\u4e00-\u9fff]{6,8})/);
    if (plate) { result.plateNumber = plate[1]; continue; }

    const vtype = line.match(/(?:车辆类型)[：:\s]*(.+)/);
    if (vtype) { result.vehicleType = vtype[1]; continue; }

    const owner = line.match(/(?:所有人|车主)[：:\s]*(.+)/);
    if (owner) { result.owner = owner[1]; continue; }

    const addr = line.match(/(?:住址|地址)[：:\s]*(.+)/);
    if (addr) { result.address = addr[1]; continue; }

    const useChar = line.match(/(?:使用性质)[：:\s]*(.+)/);
    if (useChar) { result.useCharacter = useChar[1]; continue; }

    const mdl = line.match(/(?:品牌型号|车辆型号)[：:\s]*(.+)/);
    if (mdl) { result.model = mdl[1]; continue; }

    const vinMatch = line.match(/(?:车辆识别代号|车架号|VIN)[：:\s]*([A-HJ-NPR-Z0-9]{17})/i);
    if (vinMatch) { result.vin = vinMatch[1].toUpperCase(); continue; }

    const eng = line.match(/(?:发动机号)[：:\s]*([A-Z0-9]{6,})/i);
    if (eng) { result.engineNumber = eng[1]; continue; }

    const regDate = line.match(/(?:注册日期)[：:\s]*(\d{4}\D\d{1,2}\D\d{1,2})/);
    if (regDate) {
      const [y, m, d] = regDate[1].split(/\D/);
      result.registerDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      continue;
    }

    const issDate = line.match(/(?:发证日期)[：:\s]*(\d{4}\D\d{1,2}\D\d{1,2})/);
    if (issDate) {
      const [y, m, d] = issDate[1].split(/\D/);
      result.issueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      continue;
    }
  }

  return result;
}

// ===== Main OCR Functions =====

let workerInstance: any = null;

async function getWorker(): Promise<any> {
  if (workerInstance) return workerInstance;
  // #ifdef H5
  workerInstance = await createWorker('chi_sim');
  // #endif
  return workerInstance;
}

/**
 * 对图片进行 OCR 识别（仅 H5 环境）
 * @param imagePath 图片本地路径或 base64
 * @param side 身份证正反面
 * @returns 识别结果，非 H5 环境返回 null
 */
export async function recognizeIdCard(
  imagePath: string,
  side: 'front' | 'back',
): Promise<IdCardFrontResult | IdCardBackResult | null> {
  // #ifndef H5
  console.warn('[OCR] 仅 H5 环境支持本地 OCR');
  return null;
  // #endif

  // #ifdef H5
  try {
    const worker = await getWorker();
    const { data: { text } } = await worker.recognize(imagePath);
    console.log(`[OCR] 身份证${side === 'front' ? '人像面' : '国徽面'}原始文本:\n`, text);

    return side === 'front' ? parseIdCardFront(text) : parseIdCardBack(text);
  } catch (e) {
    console.error('[OCR] 识别失败:', e);
    return null;
  }
  // #endif
}

/**
 * 行驶证 OCR 识别（仅 H5 环境）
 */
export async function recognizeVehicle(
  imagePath: string,
): Promise<VehicleOcrResult | null> {
  // #ifndef H5
  console.warn('[OCR] 仅 H5 环境支持本地 OCR');
  return null;
  // #endif

  // #ifdef H5
  try {
    const worker = await getWorker();
    const { data: { text } } = await worker.recognize(imagePath);
    console.log('[OCR] 行驶证原始文本:\n', text);

    return parseVehicleOcr(text);
  } catch (e) {
    console.error('[OCR] 行驶证识别失败:', e);
    return null;
  }
  // #endif
}

/**
 * 释放 OCR Worker（页面销毁时调用）
 */
export async function terminateOcrWorker(): Promise<void> {
  // #ifdef H5
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
  // #endif
}
