/**
 * Toast 消息类型：支持预设类型或自定义字符串
 */
type ToastType = "success" | "error" | "warning" | "info" | string;

/**
 * Toast 提示函数类型
 */
type ToastFn = (message: string, type?: ToastType) => void;

/**
 * 必填字段配置接口
 */
interface RequiredField {
  /** 表单字段键名 */
  key: string;
  /** 字段显示名称（用于提示文案） */
  label: string;
  /** 自定义动作文案，默认"请输入" */
  action?: string;
}

// ==================== 正则表达式常量 ====================

/** 中国大陆手机号码正则：1 开头，第二位 3-9，共 11 位 */
const MOBILE_PHONE_RE = /^1[3-9]\d{9}$/;

/** 固定电话正则：允许数字、横线、中英文括号，长度 7-20 */
const TEL_PHONE_RE = /^[0-9\-()（）]{7,20}$/;

/** 严格身份证正则：18 位，含出生日期合法性校验位（末尾允许 X） */
const ID_CARD_RE = /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/;

/** 简单身份证正则：仅校验 15 位或 18 位格式，不校验日期和校验位 */
const SIMPLE_ID_CARD_RE = /^(?:\d{15}|\d{17}[\dX])$/i;

/** 姓名正则：支持中文、英文、空格、中点号和英文句点，长度 2-30 */
const NAME_RE = /^[\p{Script=Han}A-Za-z·.\s]{2,30}$/u;

/** 车牌号正则：以汉字开头，第二位大写字母，后面 5-6 位字母/数字/特殊汉字 */
const PLATE_NUMBER_RE = /^[\u4E00-\u9FA5][A-Z][A-Z0-9挂学警港澳]{5,6}$/;

/** 车架号（VIN）正则：17 位字母或数字，不含 I、O、Q */
const VEHICLE_CODE_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

/** 发动机号正则：5-30 位大写字母、数字或横线 */
const ENGINE_NUMBER_RE = /^[A-Z0-9-]{5,30}$/i;

/** 金额正则：正数，最多两位小数，整数部分不允许前导零（0.x 除外） */
const MONEY_RE = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

/** 长数字关键词正则：纯数字且长度 >= 7 */
const LONG_DIGIT_RE = /^\d{7,}$/;

/** 图片文件名正则：匹配 jpg/jpeg/png/gif/webp（支持 URL 查询参数） */
const IMAGE_FILE_RE = /\.(?:jpg|jpeg|png|gif|webp)(?:\?.*)?$/i;

/** PDF 文件名正则：匹配 .pdf 后缀（支持 URL 查询参数） */
const PDF_FILE_RE = /\.pdf(?:\?.*)?$/i;

// ==================== 内部辅助函数 ====================

/**
 * 默认 Toast 提示（使用 uni.showToast，无图标）
 * @param message 提示文案
 */
function defaultToast(message: string) {
  uni.showToast({ title: message, icon: "none" });
}

/**
 * 调用 Toast 提示函数，未传入时降级使用默认 Toast
 * @param toast 自定义 Toast 函数
 * @param message 提示文案
 * @param type Toast 类型
 */
function notify(toast: ToastFn | undefined, message: string, type?: ToastType) {
  (toast || defaultToast)(message, type);
}

/**
 * 读取表单字段值
 * @param form 表单数据对象
 * @param key 字段键名
 * @returns 字段值
 */
function readField(form: Record<string, unknown>, key: string) {
  return form[key];
}

// ==================== 导出工具函数 ====================

/**
 * 判断值是否为空（undefined / null / 空字符串 / 纯空白）
 * @param value 待判断的值
 * @returns 是否为空
 */
export function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

/**
 * 将值转为字符串并去除首尾空白
 * @param value 待处理的值
 * @returns 去除空白后的字符串
 */
export function trimText(value: unknown) {
  return String(value ?? "").trim();
}

/**
 * 解析日期文本（格式：YYYY-MM-DD），返回 Date 对象或 null
 * @param value 日期字符串
 * @returns 有效的 Date 对象，或 null（格式错误/日期不存在）
 */
export function parseDateText(value: unknown) {
  const match = trimText(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

/**
 * 校验姓名是否合法
 * @param value 待校验的值
 * @returns 是否合法
 */
export function isValidName(value: unknown) {
  return NAME_RE.test(trimText(value));
}

/**
 * 校验是否为有效的中国大陆手机号码
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isMobilePhone(value: unknown) {
  return MOBILE_PHONE_RE.test(trimText(value));
}

/**
 * 校验是否为有效的固定电话号码
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isTelPhone(value: unknown) {
  return TEL_PHONE_RE.test(trimText(value));
}

/**
 * 校验是否为手机或固定电话号码
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isPhoneOrTel(value: unknown) {
  const text = trimText(value);
  return isMobilePhone(text) || isTelPhone(text);
}

/**
 * 校验 18 位中国大陆身份证号码（含日期和校验位验证）
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isValidIdCard(value: unknown) {
  const card = trimText(value).toUpperCase();
  if (!ID_CARD_RE.test(card)) return false;

  const birthday = parseDateText(`${card.slice(6, 10)}-${card.slice(10, 12)}-${card.slice(12, 14)}`);
  if (!birthday) return false;

  // 加权因子与校验码对照表
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = factors.reduce((total, factor, index) => total + Number(card[index]) * factor, 0);
  return checks[sum % 11] === card[17];
}

/**
 * 简单校验身份证格式（15 位或 18 位，不校验日期和校验位）
 * @param value 待校验的值
 * @returns 格式是否匹配
 */
export function isSimpleIdCard(value: unknown) {
  return SIMPLE_ID_CARD_RE.test(trimText(value));
}

/**
 * 校验车牌号是否合法（支持新能源及特殊车牌）
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isValidPlateNumber(value: unknown) {
  return PLATE_NUMBER_RE.test(trimText(value).toUpperCase());
}

/**
 * 校验车架号（VIN）是否合法（17 位，不含 I/O/Q）
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isValidVehicleCode(value: unknown) {
  return VEHICLE_CODE_RE.test(trimText(value));
}

/**
 * 校验发动机号是否合法
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isValidEngineNumber(value: unknown) {
  return ENGINE_NUMBER_RE.test(trimText(value));
}

/**
 * 判断是否为正数（大于 0 的有限数值）
 * @param value 待校验的值
 * @returns 是否为正数
 */
export function isPositiveNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
}

/**
 * 判断是否为非负数（大于等于 0 的有限数值）
 * @param value 待校验的值
 * @returns 是否为非负数
 */
export function isNonNegativeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0;
}

/**
 * 校验金额格式（正数，最多两位小数）
 * @param value 待校验的值
 * @returns 是否有效
 */
export function isValidMoney(value: unknown) {
  const text = trimText(value);
  return MONEY_RE.test(text) && Number(text) > 0;
}

/**
 * 校验是否为长数字关键词（纯数字且长度 >= 7）
 * @param value 待校验的值
 * @returns 是否匹配
 */
export function isLongDigitKeyword(value: unknown) {
  return LONG_DIGIT_RE.test(trimText(value));
}

/**
 * 标准化文件扩展名：去除前导点并转小写
 * @param value 扩展名字符串
 * @returns 标准化后的扩展名
 */
export function normalizeFileExtension(value: unknown) {
  return trimText(value).toLowerCase().replace(/^\./, "");
}

/**
 * 从文件名中提取扩展名
 * @param fileName 文件名
 * @returns 标准化后的扩展名
 */
export function getFileExtension(fileName: unknown) {
  const cleanName = trimText(fileName).split("?")[0].split("#")[0];
  const ext = cleanName.includes(".") ? cleanName.split(".").pop() : "";
  return normalizeFileExtension(ext);
}

/**
 * 判断文件名是否为图片类型
 * @param fileName 文件名
 * @returns 是否为图片
 */
export function isImageFileName(fileName: unknown) {
  return IMAGE_FILE_RE.test(trimText(fileName));
}

/**
 * 判断文件名是否为 PDF 类型
 * @param fileName 文件名
 * @returns 是否为 PDF
 */
export function isPdfFileName(fileName: unknown) {
  return PDF_FILE_RE.test(trimText(fileName));
}

/**
 * 批量校验必填字段，遇到第一个空字段时触发 Toast 提示并返回 false
 * @param form 表单数据对象
 * @param fields 必填字段配置数组
 * @param toast 自定义 Toast 函数（可选）
 * @param toastType Toast 类型（可选）
 * @returns 全部非空返回 true，否则返回 false
 */
export function validateRequiredFields(
  form: Record<string, unknown>,
  fields: RequiredField[],
  toast?: ToastFn,
  toastType?: ToastType,
) {
  for (const field of fields) {
    if (isBlank(readField(form, field.key))) {
      notify(toast, `${field.action || "请输入"}${field.label}`, toastType);
      return false;
    }
  }
  return true;
}
