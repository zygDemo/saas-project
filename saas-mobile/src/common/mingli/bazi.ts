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
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

/** 地支五行对照 */
export const ZHI_WUXING: Record<string, WuXing> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

/** 地支藏干 */
export const ZHI_CANG_GAN: Record<string, string[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"],
  卯: ["乙"], 辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"],
  午: ["丁", "己"], 未: ["己", "丁", "乙"], 申: ["庚", "壬", "戊"],
  酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
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
  cangGan?: CangGanInfo[];
  shenSha?: ShenSha[];
  shiShenDetail?: ShiShenDetail;
  liuNian?: LiuNianInfo;
}

/** 藏干信息 */
export interface CangGanInfo {
  zhi: string;
  gan: string[];
  wuXing: WuXing[];
}

/** 神煞 */
export interface ShenSha {
  name: string;
  description: string;
  position: string;
}

/** 十神详解 */
export interface ShiShenDetail {
  shiShen: ShiShen;
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
}

/** 流年信息 */
export interface LiuNianInfo {
  year: number;
  ganZhi: string;
  ganWuXing: WuXing;
  zhiWuXing: WuXing;
  yunshi: string;
  jianyi: string;
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
  // 日柱计算以 2000-01-07（甲子日）为锚点基准日。
  // 传统八字排盘以真太阳时（东经 120°）为准，此处使用本地时区构造日期；
  // 若用户处于非东八区，跨午夜可能产生 1 天偏差，调用方应在传入前转换为东八区日期。
  const baseDate = new Date(2000, 0, 7) // 2000-01-07 = 甲子日
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor(
    (targetDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000),
  )
  // 甲子日为 anchor：gan(甲)=TIAN_GAN[0], zhi(子)=DI_ZHI[0]
  const ganIndex = ((diffDays % 10) + 10) % 10
  const zhiIndex = ((diffDays % 12) + 12) % 12
  return { gan: TIAN_GAN[ganIndex], zhi: DI_ZHI[zhiIndex] }
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

/**
 * 十二节气近似日期（每月第一个节气）
 * 立春=2月4, 惊蛰=3月6, 清明=4月5, 立夏=5月6, 芒种=6月6, 小暑=7月7
 * 立秋=8月7, 白露=9月8, 寒露=10月8, 立冬=11月7, 大雪=12月7, 小寒=1月6
 */
const JIE_QI_DAY: number[] = [6, 4, 6, 5, 6, 6, 7, 7, 8, 8, 7, 7] // 1-12月的节气近似日

function getJieQiDate(year: number, month: number): Date {
  // 返回该月节气的近似日期
  const day = JIE_QI_DAY[month - 1]
  return new Date(year, month - 1, day)
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)))
}

export function getDaYun(siZhu: SiZhu, gender: "male" | "female", birthDate?: { year: number; month: number; day: number }): DaYun[] {
  const yearGan = siZhu.year.gan;
  const isYangYear = GAN_YINYANG[yearGan] === "阳";
  const isForward =
    (isYangYear && gender === "male") || (!isYangYear && gender === "female");
  const monthGanIndex = (TIAN_GAN as readonly string[]).indexOf(siZhu.month.gan);
  const monthZhiIndex = (DI_ZHI as readonly string[]).indexOf(siZhu.month.zhi);
  const riGan = siZhu.day.gan;
  const result: DaYun[] = [];

  // 计算起运年龄
  let startQiAge = 1; // 默认1岁起运
  if (birthDate) {
    const birth = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    if (isForward) {
      // 顺行：到下一个节气的天数
      let nextJie = getJieQiDate(birthDate.year, birthDate.month);
      if (birth.getTime() >= nextJie.getTime()) {
        // 已过本月节气，取下月
        const nextMonth = birthDate.month === 12 ? 1 : birthDate.month + 1;
        const nextYear = birthDate.month === 12 ? birthDate.year + 1 : birthDate.year;
        nextJie = getJieQiDate(nextYear, nextMonth);
      }
      const days = daysBetween(birth, nextJie);
      startQiAge = Math.max(1, Math.round(days / 3));
    } else {
      // 逆行：到上一个节气的天数
      let prevJie = getJieQiDate(birthDate.year, birthDate.month);
      if (birth.getTime() < prevJie.getTime()) {
        // 未到本月节气，取上月
        const prevMonth = birthDate.month === 1 ? 12 : birthDate.month - 1;
        const prevYear = birthDate.month === 1 ? birthDate.year - 1 : birthDate.year;
        prevJie = getJieQiDate(prevYear, prevMonth);
      }
      const days = daysBetween(birth, prevJie);
      startQiAge = Math.max(1, Math.round(days / 3));
    }
  }

  for (let i = 0; i < 8; i++) {
    const ganIdx = isForward ? (monthGanIndex + i + 1) % 10 : (monthGanIndex - i - 1 + 10) % 10;
    const zhiIdx = isForward ? (monthZhiIndex + i + 1) % 12 : (monthZhiIndex - i - 1 + 12) % 12;
    const gan = TIAN_GAN[ganIdx];
    const zhi = DI_ZHI[zhiIdx];
    result.push({
      startAge: startQiAge + i * 10,
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
    daYun: getDaYun(siZhu, gender, { year, month, day }),
    solarDate: `${year}年${month}月${day}日 ${hour}时`,
    cangGan: getCangGan(siZhu),
    shenSha: getShenSha(siZhu, riGan),
    shiShenDetail: getShiShenDetail(siZhu.day.shiShen),
    liuNian: getLiuNian(),
  };
}

/** 获取藏干信息 */
function getCangGan(siZhu: SiZhu): CangGanInfo[] {
  const pillars = [siZhu.year, siZhu.month, siZhu.day, siZhu.hour];
  return pillars.map(p => ({
    zhi: p.zhi,
    gan: ZHI_CANG_GAN[p.zhi] || [],
    wuXing: (ZHI_CANG_GAN[p.zhi] || []).map(g => GAN_WUXING[g]),
  }));
}

/** 神煞推算 */
function getShenSha(siZhu: SiZhu, riGan: string): ShenSha[] {
  const shenSha: ShenSha[] = [];
  const yearZhi = siZhu.year.zhi;
  const dayZhi = siZhu.day.zhi;
  const allZhi = [siZhu.year.zhi, siZhu.month.zhi, siZhu.day.zhi, siZhu.hour.zhi];

  // 天乙贵人
  const tianYiMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['午', '寅'],
  };
  const tianYiZhi = tianYiMap[riGan] || [];
  const positions = ['年支', '月支', '日支', '时支'];
  allZhi.forEach((zhi, idx) => {
    if (tianYiZhi.includes(zhi)) {
      shenSha.push({ name: '天乙贵人', description: '逢凶化吉，贵人相助', position: positions[idx] });
    }
  });

  // 文昌贵人
  const wenChangMap: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
    '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
  };
  if (allZhi.includes(wenChangMap[riGan])) {
    shenSha.push({ name: '文昌贵人', description: '聪明好学，才华出众', position: '四柱' });
  }

  // 桃花（咸池）
  const taoHuaMap: Record<string, string> = {
    '子': '酉', '丑': '午', '寅': '卯', '卯': '子',
    '辰': '酉', '巳': '午', '午': '卯', '未': '子',
    '申': '酉', '酉': '午', '戌': '卯', '亥': '子',
  };
  if (taoHuaMap[yearZhi] && allZhi.includes(taoHuaMap[yearZhi])) {
    shenSha.push({ name: '桃花', description: '异性缘佳，感情丰富', position: '四柱' });
  }

  // 驿马
  const yiMaMap: Record<string, string> = {
    '子': '寅', '丑': '亥', '寅': '申', '卯': '巳',
    '辰': '寅', '巳': '亥', '午': '申', '未': '巳',
    '申': '寅', '酉': '亥', '戌': '申', '亥': '巳',
  };
  if (yiMaMap[yearZhi] && allZhi.includes(yiMaMap[yearZhi])) {
    shenSha.push({ name: '驿马', description: '奔波变动，出行有利', position: '四柱' });
  }

  // 华盖
  const huaGaiMap: Record<string, string> = {
    '子': '辰', '丑': '丑', '寅': '戌', '卯': '未',
    '辰': '辰', '巳': '丑', '午': '戌', '未': '未',
    '申': '辰', '酉': '丑', '戌': '戌', '亥': '未',
  };
  if (huaGaiMap[yearZhi] && allZhi.includes(huaGaiMap[yearZhi])) {
    shenSha.push({ name: '华盖', description: '聪慧孤高，喜宗教哲学', position: '四柱' });
  }

  return shenSha;
}

/** 十神详解 */
function getShiShenDetail(shiShen: ShiShen): ShiShenDetail {
  const details: Record<ShiShen, Omit<ShiShenDetail, 'shiShen'>> = {
    '比肩': {
      personality: '独立自主，自信果断，重情重义，但有时固执己见',
      career: '适合创业、管理、自由职业，不宜合伙',
      wealth: '财运平稳，靠自身努力获取，不宜投机',
      love: '感情专一，但占有欲强，需给对方空间',
      health: '体质强健，注意肝胆和筋骨',
    },
    '劫财': {
      personality: '豪爽仗义，人缘好，但易冲动，好争斗',
      career: '适合销售、公关、竞争性行业',
      wealth: '财来财去，易破财，需谨慎理财',
      love: '异性缘佳，但易有感情纠纷',
      health: '注意意外伤害和呼吸系统',
    },
    '食神': {
      personality: '温厚善良，乐观开朗，有艺术天赋',
      career: '适合文化、艺术、餐饮、教育行业',
      wealth: '财运稳定，有口福，衣食无忧',
      love: '感情和谐，家庭美满',
      health: '注意饮食，防消化系统问题',
    },
    '伤官': {
      personality: '聪明机智，才华横溢，但叛逆不羁',
      career: '适合创意、技术、演艺、自由职业',
      wealth: '财运起伏，靠才华赚钱',
      love: '感情丰富，但易有波折',
      health: '注意神经衰弱和呼吸系统',
    },
    '正财': {
      personality: '勤俭持家，踏实稳重，重信用',
      career: '适合财务、金融、稳定职业',
      wealth: '财运亨通，正财旺盛',
      love: '婚姻稳定，配偶贤惠',
      health: '体质良好，注意脾胃',
    },
    '偏财': {
      personality: '慷慨大方，善于交际，有投资眼光',
      career: '适合投资、贸易、商业',
      wealth: '偏财运佳，有意外之财',
      love: '异性缘佳，但易有桃花',
      health: '注意泌尿系统',
    },
    '正官': {
      personality: '正直守信，有责任感，重视名誉',
      career: '适合公务员、管理、法律行业',
      wealth: '财运稳定，靠地位获取',
      love: '婚姻稳定，配偶有地位',
      health: '注意压力和神经衰弱',
    },
    '七杀': {
      personality: '果断刚毅，有魄力，但易急躁',
      career: '适合军警、管理、竞争性行业',
      wealth: '财运起伏，需冒险获取',
      love: '感情强烈，但易有冲突',
      health: '注意意外伤害和心脏',
    },
    '正印': {
      personality: '仁慈宽厚，好学上进，有贵人运',
      career: '适合教育、文化、宗教行业',
      wealth: '财运稳定，有贵人资助',
      love: '婚姻和谐，配偶贤惠',
      health: '体质良好，注意肠胃',
    },
    '偏印': {
      personality: '聪明机敏，多才多艺，但孤独',
      career: '适合技术、研究、自由职业',
      wealth: '财运起伏，靠技能赚钱',
      love: '感情波折，晚婚为宜',
      health: '注意精神压力和失眠',
    },
  };
  return { shiShen, ...details[shiShen] };
}

/** 获取流年信息 */
function getLiuNian(): LiuNianInfo {
  const now = new Date();
  const year = now.getFullYear();
  const yearGZ = getYearZhu(year);
  const ganWuXing = GAN_WUXING[yearGZ.gan];
  const zhiWuXing = ZHI_WUXING[yearGZ.zhi];

  const yunshiMap: Record<WuXing, string> = {
    '木': '生机勃勃，适合创新拓展',
    '火': '热情洋溢，适合社交展示',
    '土': '稳重踏实，适合积累沉淀',
    '金': '锐意进取，适合决断改革',
    '水': '灵活变通，适合学习旅行',
  };

  const jianyiMap: Record<WuXing, string> = {
    '木': '宜：种植、装修、学习、创新',
    '火': '宜：社交、表演、装修、旅行',
    '土': '宜：置业、储蓄、修身、养生',
    '金': '宜：投资、改革、锻炼、决断',
    '水': '宜：学习、旅行、投资、思考',
  };

  return {
    year,
    ganZhi: `${yearGZ.gan}${yearGZ.zhi}`,
    ganWuXing,
    zhiWuXing,
    yunshi: yunshiMap[ganWuXing],
    jianyi: jianyiMap[ganWuXing],
  };
}
