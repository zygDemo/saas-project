/**
 * 八字排盘核心算法
 * 包含：四柱排盘、十神推算、五行分析、大运排盘
 *
 * 数据与算法已解耦：
 * - bazi-types.ts：类型定义
 * - bazi-data.ts：常量、映射表、文案
 * - bazi.ts：纯计算逻辑
 */

import type { WuXing, ShiShen, Zhu, SiZhu, DaYun, WuXingCount, BaZiResult, CangGanInfo, ShenSha, ShiShenDetail, LiuNianInfo } from './bazi-types'
import {
  TIAN_GAN,
  DI_ZHI,
  GAN_WUXING,
  ZHI_WUXING,
  ZHI_CANG_GAN,
  GAN_YINYANG,
  WUXING_SHENG,
  WUXING_KE,
  WUXING_COLOR,
  NAYIN_TABLE,
  JIE_QI_DAY,
  SHEN_SHA_MAPS,
  SHI_SHEN_DETAILS,
  LIU_NIAN_TEXTS,
  MONTH_GAN_BASE,
  HOUR_GAN_BASE,
} from './bazi-data'

// 重新导出，保持外部 API 不变
export * from './bazi-types'
export {
  TIAN_GAN,
  DI_ZHI,
  GAN_WUXING,
  ZHI_WUXING,
  ZHI_CANG_GAN,
  GAN_YINYANG,
  WUXING_SHENG,
  WUXING_KE,
  WUXING_COLOR,
  NAYIN_TABLE,
  JIE_QI_DAY,
  SHEN_SHA_MAPS,
  SHI_SHEN_DETAILS,
  LIU_NIAN_TEXTS,
  MONTH_GAN_BASE,
  HOUR_GAN_BASE,
} from './bazi-data'

export function getNaYin(gan: string, zhi: string): string {
  return NAYIN_TABLE[`${gan}${zhi}`] || '未知'
}

export function getShiShen(riGan: string, otherGan: string): ShiShen {
  const riWuXing = GAN_WUXING[riGan]
  const otherWuXing = GAN_WUXING[otherGan]
  const riYinYang = GAN_YINYANG[riGan]
  const otherYinYang = GAN_YINYANG[otherGan]
  const sameYinYang = riYinYang === otherYinYang

  if (riWuXing === otherWuXing) return sameYinYang ? '比肩' : '劫财'
  if (WUXING_SHENG[riWuXing] === otherWuXing) return sameYinYang ? '食神' : '伤官'
  if (WUXING_SHENG[otherWuXing] === riWuXing) return sameYinYang ? '偏印' : '正印'
  if (WUXING_KE[riWuXing] === otherWuXing) return sameYinYang ? '偏财' : '正财'
  return sameYinYang ? '七杀' : '正官'
}

export function getYearZhu(year: number): { gan: string; zhi: string } {
  const ganIndex = (((year - 4) % 10) + 10) % 10
  const zhiIndex = (((year - 4) % 12) + 12) % 12
  return { gan: TIAN_GAN[ganIndex], zhi: DI_ZHI[zhiIndex] }
}

export function getMonthZhu(yearGan: string, month: number): { gan: string; zhi: string } {
  const zhiIndex = (month + 1) % 12
  const zhi = DI_ZHI[zhiIndex === 0 ? 11 : zhiIndex - 1]
  const base = MONTH_GAN_BASE[yearGan] || 0
  const ganIndex = (base + month - 1) % 10
  return { gan: TIAN_GAN[ganIndex], zhi }
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
  const zhiIndex = Math.floor((hour + 1) / 2) % 12
  const zhi = DI_ZHI[zhiIndex]
  const base = HOUR_GAN_BASE[dayGan] || 0
  const ganIndex = (base + zhiIndex) % 10
  return { gan: TIAN_GAN[ganIndex], zhi }
}

export function countWuXing(siZhu: SiZhu): WuXingCount {
  const count: WuXingCount = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  for (const zhu of [siZhu.year, siZhu.month, siZhu.day, siZhu.hour]) {
    count[zhu.ganWuXing]++
    count[zhu.zhiWuXing]++
  }
  return count
}

function getJieQiDate(year: number, month: number): Date {
  const day = JIE_QI_DAY[month - 1]
  return new Date(year, month - 1, day)
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)))
}

export function getDaYun(siZhu: SiZhu, gender: 'male' | 'female', birthDate?: { year: number; month: number; day: number }): DaYun[] {
  const yearGan = siZhu.year.gan
  const isYangYear = GAN_YINYANG[yearGan] === '阳'
  const isForward =
    (isYangYear && gender === 'male') || (!isYangYear && gender === 'female')
  const monthGanIndex = (TIAN_GAN as readonly string[]).indexOf(siZhu.month.gan)
  const monthZhiIndex = (DI_ZHI as readonly string[]).indexOf(siZhu.month.zhi)
  const riGan = siZhu.day.gan
  const result: DaYun[] = []

  let startQiAge = 1
  if (birthDate) {
    const birth = new Date(birthDate.year, birthDate.month - 1, birthDate.day)
    if (isForward) {
      let nextJie = getJieQiDate(birthDate.year, birthDate.month)
      if (birth.getTime() >= nextJie.getTime()) {
        const nextMonth = birthDate.month === 12 ? 1 : birthDate.month + 1
        const nextYear = birthDate.month === 12 ? birthDate.year + 1 : birthDate.year
        nextJie = getJieQiDate(nextYear, nextMonth)
      }
      const days = daysBetween(birth, nextJie)
      startQiAge = Math.max(1, Math.round(days / 3))
    } else {
      let prevJie = getJieQiDate(birthDate.year, birthDate.month)
      if (birth.getTime() < prevJie.getTime()) {
        const prevMonth = birthDate.month === 1 ? 12 : birthDate.month - 1
        const prevYear = birthDate.month === 1 ? birthDate.year - 1 : birthDate.year
        prevJie = getJieQiDate(prevYear, prevMonth)
      }
      const days = daysBetween(birth, prevJie)
      startQiAge = Math.max(1, Math.round(days / 3))
    }
  }

  for (let i = 0; i < 8; i++) {
    const ganIdx = isForward ? (monthGanIndex + i + 1) % 10 : (monthGanIndex - i - 1 + 10) % 10
    const zhiIdx = isForward ? (monthZhiIndex + i + 1) % 12 : (monthZhiIndex - i - 1 + 12) % 12
    const gan = TIAN_GAN[ganIdx]
    const zhi = DI_ZHI[zhiIdx]
    result.push({
      startAge: startQiAge + i * 10,
      gan,
      zhi,
      ganWuXing: GAN_WUXING[gan],
      zhiWuXing: ZHI_WUXING[zhi],
      shiShen: getShiShen(riGan, gan),
    })
  }
  return result
}

function createZhu(gan: string, zhi: string, riGan: string): Zhu {
  return {
    gan,
    zhi,
    ganWuXing: GAN_WUXING[gan],
    zhiWuXing: ZHI_WUXING[zhi],
    shiShen: getShiShen(riGan, gan),
    naYin: getNaYin(gan, zhi),
  }
}

export function paiPan(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
): BaZiResult {
  const yearGZ = getYearZhu(year)
  const monthGZ = getMonthZhu(yearGZ.gan, month)
  const dayGZ = getDayZhu(year, month, day)
  const hourGZ = getHourZhu(dayGZ.gan, hour)
  const riGan = dayGZ.gan

  const siZhu: SiZhu = {
    year: createZhu(yearGZ.gan, yearGZ.zhi, riGan),
    month: createZhu(monthGZ.gan, monthGZ.zhi, riGan),
    day: createZhu(dayGZ.gan, dayGZ.zhi, riGan),
    hour: createZhu(hourGZ.gan, hourGZ.zhi, riGan),
  }

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
  }
}

function getCangGan(siZhu: SiZhu): CangGanInfo[] {
  const pillars = [siZhu.year, siZhu.month, siZhu.day, siZhu.hour]
  return pillars.map(p => ({
    zhi: p.zhi,
    gan: ZHI_CANG_GAN[p.zhi] || [],
    wuXing: (ZHI_CANG_GAN[p.zhi] || []).map(g => GAN_WUXING[g]),
  }))
}

function getShenSha(siZhu: SiZhu, riGan: string): ShenSha[] {
  const shenSha: ShenSha[] = []
  const yearZhi = siZhu.year.zhi
  const allZhi = [siZhu.year.zhi, siZhu.month.zhi, siZhu.day.zhi, siZhu.hour.zhi]
  const positions = ['年支', '月支', '日支', '时支']

  const tianYiZhi = SHEN_SHA_MAPS.tianYi[riGan] || []
  allZhi.forEach((zhi, idx) => {
    if (tianYiZhi.includes(zhi)) {
      shenSha.push({ name: '天乙贵人', description: '逢凶化吉，贵人相助', position: positions[idx] })
    }
  })

  const wenChangZhi = SHEN_SHA_MAPS.wenChang[riGan]
  if (wenChangZhi && allZhi.includes(wenChangZhi)) {
    shenSha.push({ name: '文昌贵人', description: '聪明好学，才华出众', position: '四柱' })
  }

  const taoHuaZhi = SHEN_SHA_MAPS.taoHua[yearZhi]
  if (taoHuaZhi && allZhi.includes(taoHuaZhi)) {
    shenSha.push({ name: '桃花', description: '异性缘佳，感情丰富', position: '四柱' })
  }

  const yiMaZhi = SHEN_SHA_MAPS.yiMa[yearZhi]
  if (yiMaZhi && allZhi.includes(yiMaZhi)) {
    shenSha.push({ name: '驿马', description: '奔波变动，出行有利', position: '四柱' })
  }

  const huaGaiZhi = SHEN_SHA_MAPS.huaGai[yearZhi]
  if (huaGaiZhi && allZhi.includes(huaGaiZhi)) {
    shenSha.push({ name: '华盖', description: '聪慧孤高，喜宗教哲学', position: '四柱' })
  }

  return shenSha
}

function getShiShenDetail(shiShen: ShiShen): ShiShenDetail {
  const detail = SHI_SHEN_DETAILS[shiShen]
  return { shiShen, ...detail }
}

function getLiuNian(): LiuNianInfo {
  const now = new Date()
  const year = now.getFullYear()
  const yearGZ = getYearZhu(year)
  const ganWuXing = GAN_WUXING[yearGZ.gan]
  const zhiWuXing = ZHI_WUXING[yearGZ.zhi]

  return {
    year,
    ganZhi: `${yearGZ.gan}${yearGZ.zhi}`,
    ganWuXing,
    zhiWuXing,
    yunshi: LIU_NIAN_TEXTS.yunshi[ganWuXing],
    jianyi: LIU_NIAN_TEXTS.jianyi[ganWuXing],
  }
}
