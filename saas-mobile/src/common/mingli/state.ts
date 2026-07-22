/**
 * 命理模块页面间临时状态传递
 *
 * 用于替代大对象 URL query，避免 URL 长度超限和重复计算。
 * 页面跳转时写入，结果页读取后清空，支持刷新/直接打开时的 fallback。
 */

import type { BaZiResult } from './bazi-types'
import type { LiuYaoResult } from './liuyao-types'

interface BaziInputState {
  birthDate: string
  birthHour: number
  gender: 'male' | 'female'
  isLunar: boolean
  timeLabel: string
  lunarInfo: string
  result: BaZiResult
}

interface LiuYaoInputState {
  question: string
  values: number[]
  result: LiuYaoResult
}

type StateType = 'bazi' | 'liuyao'

interface MingliState {
  bazi?: BaziInputState
  liuyao?: LiuYaoInputState
}

const state: MingliState = {}

export function setBaziState(payload: BaziInputState) {
  state.bazi = payload
}

export function getBaziState(): BaziInputState | undefined {
  return state.bazi
}

export function clearBaziState() {
  delete state.bazi
}

export function setLiuYaoState(payload: LiuYaoInputState) {
  state.liuyao = payload
}

export function getLiuYaoState(): LiuYaoInputState | undefined {
  return state.liuyao
}

export function clearLiuYaoState() {
  delete state.liuyao
}

export function clearAllMingliState() {
  delete state.bazi
  delete state.liuyao
}

/** 序列化结果对象到 Storage，作为持久化 fallback */
export function persistMingliResult<T>(key: 'mingli_bazi_result' | 'mingli_liuyao_result', result: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify(result))
  }
  catch {
    // 忽略存储异常
  }
}

export function loadMingliResult<T>(key: 'mingli_bazi_result' | 'mingli_liuyao_result'): T | undefined {
  try {
    const raw = uni.getStorageSync(key) as string | undefined
    return raw ? (JSON.parse(raw) as T) : undefined
  }
  catch {
    return undefined
  }
}

export function removeMingliResult(key: 'mingli_bazi_result' | 'mingli_liuyao_result'): void {
  try {
    uni.removeStorageSync(key)
  }
  catch {
    // 忽略存储异常
  }
}
