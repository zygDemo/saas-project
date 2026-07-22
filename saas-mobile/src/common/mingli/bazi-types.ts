/**
 * 八字排盘相关类型定义
 */

/** 五行 */
export type WuXing = '金' | '木' | '水' | '火' | '土'

/** 十神 */
export type ShiShen =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '正财'
  | '偏财'
  | '正官'
  | '七杀'
  | '正印'
  | '偏印'

/** 一柱（天干+地支） */
export interface Zhu {
  gan: string
  zhi: string
  ganWuXing: WuXing
  zhiWuXing: WuXing
  shiShen: ShiShen
  naYin: string
}

/** 四柱 */
export interface SiZhu {
  year: Zhu
  month: Zhu
  day: Zhu
  hour: Zhu
}

/** 大运 */
export interface DaYun {
  startAge: number
  gan: string
  zhi: string
  ganWuXing: WuXing
  zhiWuXing: WuXing
  shiShen: ShiShen
}

/** 五行统计 */
export interface WuXingCount {
  金: number
  木: number
  水: number
  火: number
  土: number
}

/** 八字排盘结果 */
export interface BaZiResult {
  siZhu: SiZhu
  riZhu: string
  riZhuWuXing: WuXing
  wuXingCount: WuXingCount
  daYun: DaYun[]
  solarDate: string
  cangGan?: CangGanInfo[]
  shenSha?: ShenSha[]
  shiShenDetail?: ShiShenDetail
  liuNian?: LiuNianInfo
}

/** 藏干信息 */
export interface CangGanInfo {
  zhi: string
  gan: string[]
  wuXing: WuXing[]
}

/** 神煞 */
export interface ShenSha {
  name: string
  description: string
  position: string
}

/** 十神详解 */
export interface ShiShenDetail {
  shiShen: ShiShen
  personality: string
  career: string
  wealth: string
  love: string
  health: string
}

/** 流年信息 */
export interface LiuNianInfo {
  year: number
  ganZhi: string
  ganWuXing: WuXing
  zhiWuXing: WuXing
  yunshi: string
  jianyi: string
}
