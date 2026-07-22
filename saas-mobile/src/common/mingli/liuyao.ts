/**
 * 六爻排盘核心算法
 * 包含：摇卦、纳甲、六亲、六神、世应
 *
 * 数据与算法已解耦：
 * - liuyao-types.ts：类型定义
 * - liuyao-data.ts：常量、六十四卦、爻辞、纳甲表等数据
 * - liuyao.ts：纯计算逻辑
 */

import { getDayZhu, GAN_WUXING, ZHI_WUXING } from './bazi'
import type { LiuShen, LiuQin, Yao, Gua64, LiuYaoResult, DongYaoDetail, GuaXiang } from './liuyao-types'
import {
  BA_GUA,
  GUA_WUXING,
  GUA_XIANG,
  YAO_NAMES,
  NAJIA_TABLE,
  GUA64_DATA,
  YAO_CI_TABLE,
  LIU_SHEN_START_MAP,
  DONG_YAO_MEANINGS,
  LIU_QIN_WUXING_RULES,
} from './liuyao-data'

// 重新导出，保持外部 API 不变
export * from './liuyao-types'
export {
  BA_GUA,
  GUA_WUXING,
  GUA_XIANG,
  YAO_NAMES,
  NAJIA_TABLE,
  GUA64_DATA,
  YAO_CI_TABLE,
  LIU_SHEN_START_MAP,
  DONG_YAO_MEANINGS,
  LIU_QIN_WUXING_RULES,
} from './liuyao-data'

/** 根据日干排六神 */
export function getLiuShenByDay(riGan: string): LiuShen[] {
  const allLiuShen: LiuShen[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']
  const start = allLiuShen.indexOf(LIU_SHEN_START_MAP[riGan] || '青龙')
  const result: LiuShen[] = []
  for (let i = 0; i < 6; i++) {
    result.push(allLiuShen[(start + i) % 6])
  }
  return result
}

/** 根据卦宫五行和爻地支推算六亲 */
export function getLiuQin(guaWuXing: '金' | '木' | '水' | '火' | '土', yaoWuXing: '金' | '木' | '水' | '火' | '土'): LiuQin {
  if (guaWuXing === yaoWuXing) return '兄弟'
  if (LIU_QIN_WUXING_RULES.sheng[guaWuXing] === yaoWuXing) return '子孙'
  if (LIU_QIN_WUXING_RULES.sheng[yaoWuXing] === guaWuXing) return '父母'
  if (LIU_QIN_WUXING_RULES.ke[guaWuXing] === yaoWuXing) return '妻财'
  return '官鬼'
}

/** 摇卦 - 生成6个爻值 */
export function yaoGua(): number[] {
  const result: number[] = []
  for (let i = 0; i < 6; i++) {
    let sum = 0
    for (let j = 0; j < 3; j++) {
      sum += Math.random() < 0.5 ? 2 : 3
    }
    result.push(sum)
  }
  return result
}

/** 根据爻值获取阴阳 */
export function getYinYang(value: number): '阳' | '阴' {
  return value === 7 || value === 9 ? '阳' : '阴'
}

/** 判断是否动爻 */
export function isDongYao(value: number): boolean {
  return value === 6 || value === 9
}

/** 获取变爻阴阳 */
export function getBianYinYang(value: number): '阳' | '阴' {
  return value === 6 ? '阳' : '阴'
}

/** 根据6个爻值确定上下卦 */
export function getGuaFromYao(values: number[]): { upper: string; lower: string } {
  const lowerYao = values.slice(0, 3).map(v => (getYinYang(v) === '阳' ? 1 : 0))
  const upperYao = values.slice(3, 6).map(v => (getYinYang(v) === '阳' ? 1 : 0))

  const guaMap: Record<string, string> = {
    '111': '乾', '110': '兑', '101': '离', '100': '震',
    '011': '巽', '010': '坎', '001': '艮', '000': '坤',
  }

  return {
    upper: guaMap[upperYao.join('')] || '乾',
    lower: guaMap[lowerYao.join('')] || '乾',
  }
}

/** 获取卦数据 */
export function getGua64(upper: string, lower: string): Gua64 {
  const key = upper + lower
  const data = GUA64_DATA[key] || GUA64_DATA['乾乾']

  return {
    name: data.name,
    fullName: data.fullName,
    upper,
    lower,
    shiYao: data.shiYao,
    yingYao: data.yingYao,
    guaCi: data.guaCi,
    yaoCi: YAO_CI_TABLE[key] || YAO_CI_TABLE['乾乾'] || [],
  }
}

/** 完整六爻排盘 */
export function liuYaoPaiPan(question: string, yaoValues?: number[]): LiuYaoResult {
  const values = Array.isArray(yaoValues) && yaoValues.length === 6
    ? yaoValues.map(value => ([6, 7, 8, 9].includes(value) ? value : 7))
    : yaoGua()
  const gua = getGuaFromYao(values)
  const benGua = getGua64(gua.upper, gua.lower)
  const guaWuXing = GUA_WUXING[benGua.upper]

  const now = new Date()
  const dayGZ = getDayZhu(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const riGan = dayGZ.gan
  const riGanZhi = dayGZ.gan + dayGZ.zhi
  const riWuXing = GAN_WUXING[dayGZ.gan]
  const liuShenList = getLiuShenByDay(riGan)

  const dongYao: number[] = []
  const yaoList: Yao[] = values.map((v, i) => {
    const isDong = isDongYao(v)
    if (isDong) dongYao.push(i + 1)

    const trigram = i < 3 ? gua.lower : gua.upper
    const zhiIdx = i < 3 ? i : i - 3
    const zhi = NAJIA_TABLE[trigram]?.zhi[zhiIdx] || '子'
    const yaoWuXing = ZHI_WUXING[zhi]

    return {
      position: i + 1,
      yinYang: getYinYang(v),
      isDong,
      bianYinYang: isDong ? getBianYinYang(v) : undefined,
      liuQin: getLiuQin(guaWuXing, yaoWuXing),
      liuShen: liuShenList[i],
      diZhi: zhi,
      name: YAO_NAMES[i],
    }
  })

  let bianGua: Gua64 | undefined
  if (dongYao.length > 0) {
    const bianValues = values.map(v => (isDongYao(v) ? (v === 6 ? 9 : 6) : v))
    const bianGuaNames = getGuaFromYao(bianValues)
    bianGua = getGua64(bianGuaNames.upper, bianGuaNames.lower)
  }

  const guaXiang = getGuaXiang(values, gua.upper, gua.lower)
  const dongYaoDetail = getDongYaoDetail(yaoList, dongYao)

  return {
    benGua,
    bianGua,
    yaoList,
    dongYao,
    riGanZhi,
    riWuXing,
    question,
    time: now.toLocaleString('zh-CN'),
    dongYaoDetail,
    guaXiang,
  }
}

/** 获取卦象图形 */
function getGuaXiang(values: number[], upperName: string, lowerName: string): GuaXiang {
  const lower = values.slice(0, 3).map(v => v === 7 || v === 9)
  const upper = values.slice(3, 6).map(v => v === 7 || v === 9)
  return { upper, lower, upperName, lowerName }
}

/** 获取动爻详解 */
function getDongYaoDetail(yaoList: Yao[], dongYao: number[]): DongYaoDetail[] {
  return dongYao.map(pos => {
    const yao = yaoList[pos - 1]
    const yinYang = yao.yinYang
    const bianYinYang = yao.bianYinYang || (yinYang === '阳' ? '阴' : '阳')
    const key = `${yinYang}变${bianYinYang}`
    const meaning = DONG_YAO_MEANINGS[yao.liuQin]?.[key] || '此爻变化，需结合卦辞综合判断'

    return {
      position: pos,
      name: yao.name,
      yinYang,
      bianYinYang,
      liuQin: yao.liuQin,
      meaning,
    }
  })
}
