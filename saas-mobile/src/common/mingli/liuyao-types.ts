/**
 * 六爻排盘相关类型定义
 */

/** 六神 */
export type LiuShen = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武'

/** 六亲 */
export type LiuQin = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼'

/** 单爻 */
export interface Yao {
  position: number // 位置 (1-6)
  yinYang: '阳' | '阴' // 阴阳
  isDong: boolean // 是否动爻
  bianYinYang?: '阳' | '阴' // 变爻阴阳
  liuQin: LiuQin // 六亲
  liuShen: LiuShen // 六神
  diZhi: string // 地支（纳甲）
  name: string // 爻位名称
}

/** 六十四卦 */
export interface Gua64 {
  name: string // 卦名
  fullName: string // 全名（如"乾为天"）
  upper: string // 上卦
  lower: string // 下卦
  shiYao: number // 世爻位置
  yingYao: number // 应爻位置
  guaCi: string // 卦辞
  yaoCi: string[] // 六爻爻辞
}

/** 六爻排盘结果 */
export interface LiuYaoResult {
  benGua: Gua64 // 本卦
  bianGua?: Gua64 // 变卦
  yaoList: Yao[] // 六爻列表
  dongYao: number[] // 动爻位置
  riGanZhi: string // 日干支
  riWuXing: string // 日五行
  question: string // 占问事项
  time: string // 占卜时间
  dongYaoDetail?: DongYaoDetail[] // 动爻详解
  guaXiang?: GuaXiang // 卦象图形
}

/** 动爻详解 */
export interface DongYaoDetail {
  position: number // 爻位
  name: string // 爻名
  yinYang: '阳' | '阴' // 原爻
  bianYinYang: '阳' | '阴' // 变爻
  liuQin: LiuQin // 六亲
  meaning: string // 含义解读
}

/** 卦象图形数据 */
export interface GuaXiang {
  upper: boolean[] // 上卦三爻 (true=阳, false=阴)
  lower: boolean[] // 下卦三爻
  upperName: string // 上卦名
  lowerName: string // 下卦名
}
