/**
 * 八字排盘核心算法
 * 包含：四柱排盘、十神推算、五行分析、大运排盘
 */

// ==================== 基础数据 ====================

/** 天干 */
export const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** 地支 */
export const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 五行 */
export type WuXing = "金" | "木" | "水" | "火" | "土";

/** 十神 */
export type ShiShen =
  | "比肩"
  | "劫财"
  | "食神"
  | "伤官"
  | "正财"
  | "偏财"
  | "正官"
  | "七杀"
  | "正印"
  | "偏印";

/** 天干五行对照 */
export const GAN_WUXING: Record<string, WuXing> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

/** 地支五行对照 */
export const ZHI_WUXING: Record<string, WuXing> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

/** 天干阴阳 */
export const GAN_YINYANG: Record<string, "阴" | "阳"> = {
  甲: "阳",
  乙: "阴",
  丙: "阳",
  丁: "阴",
  戊: "阳",
  己: "阴",
  庚: "阳",
  辛: "阴",
  壬: "阳",
  癸: "阴",
};

/** 五行相生 */
export const WUXING_SHENG: Record<WuXing, WuXing> = {
  金: "水",
  水: "木",
  木: "火",
  火: "土",
  土: "金",
};

/** 五行相克 */
export const WUXING_KE: Record<WuXing, WuXing> = {
  金: "木",
  木: "土",
  土: "水",
  水: "火",
  火: "金",
};

/** 五行颜色 */
export const WUXING_COLOR: Record<WuXing, string> = {
  金: "#FFD700",
  木: "#228B22",
  水: "#1E90FF",
  火: "#FF4500",
  土: "#8B4513",
};

// ==================== 类型定义 ====================

/** 一柱（天干+地支） */
export interface Zhu {
  gan: string;
  zhi: string;
  ganWuXing: WuXing;
  zhiWuXing: WuXing;
  shiShen: ShiShen;
  naYin: string;
}

/** 四柱 */
export interface SiZhu {
  year: Zhu;
  month: Zhu;
  day: Zhu;
  hour: Zhu;
}

/** 大运 */
export interface DaYun {
  startAge: number;
  gan: string;
  zhi: string;
  ganWuXing: WuXing;
  zhiWuXing: WuXing;
  shiShen: ShiShen;
}

/** 五行统计 */
export interface WuXingCount {
  金: number;
  木: number;
  水: number;
  火: number;
  土: number;
}

/** 八字排盘结果 */
export interface BaZiResult {
  siZhu: SiZhu;
  riZhu: string;
  riZhuWuXing: WuXing;
  wuXingCount: WuXingCount;
  daYun: DaYun[];
  solarDate: string;
}

// ==================== 纳音五行 ====================

const NAYIN_TABLE: Record<string, string> = {
  甲子: "海中金",
  乙丑: "海中金",
  丙寅: "炉中火",
  丁卯: "炉中火",
  戊辰: "大林木",
  己巳: "大林木",
  庚午: "路旁土",
  辛未: "路旁土",
  壬申: "剑锋金",
  癸酉: "剑锋金",
  甲戌: "山头火",
  乙亥: "山头火",
  丙子: "涧下水",
  丁丑: "涧下水",
  戊寅: "城头土",
  己卯: "城头土",
  庚辰: "白蜡金",
  辛巳: "白蜡金",
  壬午: "杨柳木",
  癸未: "杨柳木",
  甲申: "泉中水",
  乙酉: "泉中水",
  丙戌: "屋上土",
  丁亥: "屋上土",
  戊子: "霹雳火",
  己丑: "霹雳火",
  庚寅: "松柏木",
  辛卯: "松柏木",
  壬辰: "长流水",
  癸巳: "长流水",
  甲午: "沙中金",
  乙未: "沙中金",
  丙申: "山下火",
  丁酉: "山下火",
  戊戌: "平地木",
  己亥: "平地木",
  庚子: "壁上土",
  辛丑: "壁上土",
  壬寅: "金箔金",
  癸卯: "金箔金",
  甲辰: "覆灯火",
  乙巳: "覆灯火",
  丙午: "天河水",
  丁未: "天河水",
  戊申: "大驿土",
  己酉: "大驿土",
  庚戌: "钗钏金",
  辛亥: "钗钏金",
  壬子: "桑柘木",
  癸丑: "桑柘木",
  甲寅: "大溪水",
  乙卯: "大溪水",
  丙辰: "沙中土",
  丁巳: "沙中土",
  戊午: "天上火",
  己未: "天上火",
  庚申: "石榴木",
  辛酉: "石榴木",
  壬戌: "大海水",
  癸亥: "大海水",
};

// ==================== 核心算法 ====================

export function getNaYin(gan: string, zhi: string): string {
  return NAYIN_TABLE[`${gan}${zhi}`] || "未知";
}

export function getShiShen(riGan: string, otherGan: string): ShiShen {
  const riWuXing = GAN_WUXING[riGan];
  const otherWuXing = GAN_WUXING[otherGan];
  const riYinYang = GAN_YINYANG[riGan];
  const otherYinYang = GAN_YINYANG[otherGan];
  const sameYinYang = riYinYang === otherYinYang;

  if (riWuXing === otherWuXing) return sameYinYang ? "比肩" : "劫财";
  if (WUXING_SHENG[riWuXing] === otherWuXing) return sameYinYang ? "食神" : "伤官";
  if (WUXING_SHENG[otherWuXing] === riWuXing) return sameYinYang ? "偏印" : "正印";
  if (WUXING_KE[riWuXing] === otherWuXing) return sameYinYang ? "偏财" : "正财";
  return sameYinYang ? "七杀" : "正官";
}

export function getYearZhu(year: number): { gan: string; zhi: string } {
  const ganIndex = (((year - 4) % 10) + 10) % 10;
  const zhiIndex = (((year - 4) % 12) + 12) % 12;
  return { gan: TIAN_GAN[ganIndex], zhi: DI_ZHI[zhiIndex] };
}

export function getMonthZhu(yearGan: string, month: number): { gan: string; zhi: string } {
  const zhiIndex = (month + 1) % 12;
  const zhi = DI_ZHI[zhiIndex === 0 ? 11 : zhiIndex - 1];
  const baseMap: Record<string, number> = {
    甲: 2,
    己: 2,
    乙: 4,
    庚: 4,
    丙: 6,
    辛: 6,
    丁: 8,
    壬: 8,
    戊: 0,
    癸: 0,
  };
  const base = baseMap[yearGan] || 0;
  const ganIndex = (base + month - 1) % 10;
  return { gan: TIAN_GAN[ganIndex], zhi };
}

export function getDayZhu(year: number, month: number, day: number): { gan: string; zhi: string } {
  // 注意：此处使用本地时区构造日期，若用户处于非东八区，跨午夜可能产生 1 天偏差。
  // 八字排盘传统上以真太阳时（东经120°）为准，如需精确，应在调用前将输入日期时间
  // 转换为东八区时间再传入。
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor(
    (targetDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000),
  );
  const ganIndex = ((diffDays % 10) + 10) % 10;
  const zhiIndex = ((diffDays % 12) + 12) % 12;
  return { gan: TIAN_GAN[ganIndex], zhi: DI_ZHI[zhiIndex] };
}

export function getHourZhu(dayGan: string, hour: number): { gan: string; zhi: string } {
  const zhiIndex = Math.floor((hour + 1) / 2) % 12;
  const zhi = DI_ZHI[zhiIndex];
  const baseMap: Record<string, number> = {
    甲: 0,
    己: 0,
    乙: 2,
    庚: 2,
    丙: 4,
    辛: 4,
    丁: 6,
    壬: 6,
    戊: 8,
    癸: 8,
  };
  const base = baseMap[dayGan] || 0;
  const ganIndex = (base + zhiIndex) % 10;
  return { gan: TIAN_GAN[ganIndex], zhi };
}

export function countWuXing(siZhu: SiZhu): WuXingCount {
  const count: WuXingCount = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const zhu of [siZhu.year, siZhu.month, siZhu.day, siZhu.hour]) {
    count[zhu.ganWuXing]++;
    count[zhu.zhiWuXing]++;
  }
  return count;
}

export function getDaYun(siZhu: SiZhu, gender: "male" | "female"): DaYun[] {
  const yearGan = siZhu.year.gan;
  const isYangYear = GAN_YINYANG[yearGan] === "阳";
  const isForward =
    (isYangYear && gender === "male") || (!isYangYear && gender === "female");
  const monthGanIndex = (TIAN_GAN as readonly string[]).indexOf(siZhu.month.gan);
  const monthZhiIndex = (DI_ZHI as readonly string[]).indexOf(siZhu.month.zhi);
  const riGan = siZhu.day.gan;
  const result: DaYun[] = [];

  for (let i = 1; i <= 8; i++) {
    const ganIdx = isForward ? (monthGanIndex + i) % 10 : (monthGanIndex - i + 10) % 10;
    const zhiIdx = isForward ? (monthZhiIndex + i) % 12 : (monthZhiIndex - i + 12) % 12;
    const gan = TIAN_GAN[ganIdx];
    const zhi = DI_ZHI[zhiIdx];
    result.push({
      startAge: i * 10,
      gan,
      zhi,
      ganWuXing: GAN_WUXING[gan],
      zhiWuXing: ZHI_WUXING[zhi],
      shiShen: getShiShen(riGan, gan),
    });
  }
  return result;
}

function createZhu(gan: string, zhi: string, riGan: string): Zhu {
  return {
    gan,
    zhi,
    ganWuXing: GAN_WUXING[gan],
    zhiWuXing: ZHI_WUXING[zhi],
    shiShen: getShiShen(riGan, gan),
    naYin: getNaYin(gan, zhi),
  };
}

/** 完整八字排盘 */
export function paiPan(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: "male" | "female",
): BaZiResult {
  const yearGZ = getYearZhu(year);
  const monthGZ = getMonthZhu(yearGZ.gan, month);
  const dayGZ = getDayZhu(year, month, day);
  const hourGZ = getHourZhu(dayGZ.gan, hour);
  const riGan = dayGZ.gan;

  const siZhu: SiZhu = {
    year: createZhu(yearGZ.gan, yearGZ.zhi, riGan),
    month: createZhu(monthGZ.gan, monthGZ.zhi, riGan),
    day: createZhu(dayGZ.gan, dayGZ.zhi, riGan),
    hour: createZhu(hourGZ.gan, hourGZ.zhi, riGan),
  };

  return {
    siZhu,
    riZhu: riGan,
    riZhuWuXing: GAN_WUXING[riGan],
    wuXingCount: countWuXing(siZhu),
    daYun: getDaYun(siZhu, gender),
    solarDate: `${year}年${month}月${day}日 ${hour}时`,
  };
}
