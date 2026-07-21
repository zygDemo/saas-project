/** 时辰数据项 */
export interface ShiChenItem {
  /** 时辰名称（子时、丑时...） */
  label: string
  /** 时间范围 */
  range: string
  /** 对应小时值 */
  value: number
}

/** 十二时辰完整列表 */
export const SHI_CHEN_LIST: ShiChenItem[] = [
  { label: '子时', range: '23:00-01:00', value: 0 },
  { label: '丑时', range: '01:00-03:00', value: 2 },
  { label: '寅时', range: '03:00-05:00', value: 4 },
  { label: '卯时', range: '05:00-07:00', value: 6 },
  { label: '辰时', range: '07:00-09:00', value: 8 },
  { label: '巳时', range: '09:00-11:00', value: 10 },
  { label: '午时', range: '11:00-13:00', value: 12 },
  { label: '未时', range: '13:00-15:00', value: 14 },
  { label: '申时', range: '15:00-17:00', value: 16 },
  { label: '酉时', range: '17:00-19:00', value: 18 },
  { label: '戌时', range: '19:00-21:00', value: 20 },
  { label: '亥时', range: '21:00-23:00', value: 22 },
]
