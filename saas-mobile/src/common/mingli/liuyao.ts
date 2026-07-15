/**
 * 六爻排盘核心算法
 * 包含：摇卦、纳甲、六亲、六神、世应
 */

// ==================== 基础数据 ====================

/** 八卦 */
export const BA_GUA = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const

/** 八卦五行 */
export const GUA_WUXING: Record<string, '金' | '木' | '水' | '火' | '土'> = {
  '乾': '金', '兑': '金',
  '离': '火',
  '震': '木', '巽': '木',
  '坎': '水',
  '艮': '土', '坤': '土'
}

/** 八卦象征 */
export const GUA_XIANG: Record<string, string> = {
  '乾': '天', '兑': '泽', '离': '火', '震': '雷',
  '巽': '风', '坎': '水', '艮': '山', '坤': '地'
}

/** 六神 */
export type LiuShen = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武'

/** 六亲 */
export type LiuQin = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼'

/** 爻位名称 */
export const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const

// ==================== 类型定义 ====================

/** 单爻 */
export interface Yao {
  position: number      // 位置 (1-6)
  yinYang: '阳' | '阴'  // 阴阳
  isDong: boolean       // 是否动爻
  bianYinYang?: '阳' | '阴'  // 变爻阴阳
  liuQin: LiuQin        // 六亲
  liuShen: LiuShen      // 六神
  diZhi: string         // 地支（纳甲）
  name: string          // 爻位名称
}

/** 六十四卦 */
export interface Gua64 {
  name: string          // 卦名
  fullName: string      // 全名（如"乾为天"）
  upper: string         // 上卦
  lower: string         // 下卦
  shiYao: number        // 世爻位置
  yingYao: number       // 应爻位置
  guaCi: string         // 卦辞
  yaoCi: string[]       // 六爻爻辞
}

/** 六爻排盘结果 */
export interface LiuYaoResult {
  benGua: Gua64         // 本卦
  bianGua?: Gua64       // 变卦
  yaoList: Yao[]        // 六爻列表
  dongYao: number[]     // 动爻位置
  riGanZhi: string      // 日干支
  riWuXing: string      // 日五行
  question: string      // 占问事项
  time: string          // 占卜时间
}

// ==================== 八卦纳甲 ====================

/**
 * 八卦纳甲表
 * 每卦配天干和六爻地支
 */
const NAJIA_TABLE: Record<string, { gan: string; zhi: string[] }> = {
  '乾': { gan: '甲', zhi: ['子', '寅', '辰', '午', '申', '戌'] },
  '坤': { gan: '乙', zhi: ['未', '巳', '卯', '丑', '亥', '酉'] },
  '震': { gan: '庚', zhi: ['子', '寅', '辰', '午', '申', '戌'] },
  '巽': { gan: '辛', zhi: ['丑', '亥', '酉', '未', '巳', '卯'] },
  '坎': { gan: '戊', zhi: ['寅', '辰', '午', '申', '戌', '子'] },
  '离': { gan: '己', zhi: ['卯', '丑', '亥', '酉', '未', '巳'] },
  '艮': { gan: '丙', zhi: ['辰', '午', '申', '戌', '子', '寅'] },
  '兑': { gan: '丁', zhi: ['巳', '卯', '丑', '亥', '酉', '未'] }
}

// ==================== 六十四卦数据 ====================

/** 六十四卦基础数据（简版） */
// 八宫六十四卦数据
// 世应规则：纯卦(6,3)、一世(1,4)、二世(2,5)、三世(3,6)、四世(4,1)、五世(5,2)、游魂(4,1)、归魂(3,6)

const GUA64_DATA: Record<string, { name: string; fullName: string; shiYao: number; yingYao: number; guaCi: string; palace: string }> = {
  // ========== 乾宫 ==========
  '乾乾': { name: '乾', fullName: '乾为天', shiYao: 6, yingYao: 3, guaCi: '元亨利贞', palace: '乾' },
  '乾巽': { name: '姤', fullName: '天风姤', shiYao: 1, yingYao: 4, guaCi: '女壮，勿用取女', palace: '乾' },
  '乾艮': { name: '遁', fullName: '天山遁', shiYao: 2, yingYao: 5, guaCi: '亨，小利贞', palace: '乾' },
  '乾坤': { name: '否', fullName: '天地否', shiYao: 3, yingYao: 6, guaCi: '否之匪人，不利君子贞', palace: '乾' },
  '巽坤': { name: '观', fullName: '风地观', shiYao: 4, yingYao: 1, guaCi: '盥而不荐，有孚颙若', palace: '乾' },
  '艮坤': { name: '剥', fullName: '山地剥', shiYao: 5, yingYao: 2, guaCi: '不利有攸往', palace: '乾' },
  '离坤': { name: '晋', fullName: '火地晋', shiYao: 4, yingYao: 1, guaCi: '康侯用锡马蕃庶，昼日三接', palace: '乾' },
  '离乾': { name: '大有', fullName: '火天大有', shiYao: 3, yingYao: 6, guaCi: '元亨', palace: '乾' },

  // ========== 坤宫 ==========
  '坤坤': { name: '坤', fullName: '坤为地', shiYao: 6, yingYao: 3, guaCi: '元亨，利牝马之贞', palace: '坤' },
  '坤震': { name: '复', fullName: '地雷复', shiYao: 1, yingYao: 4, guaCi: '亨。出入无疾，朋来无咎', palace: '坤' },
  '坤兑': { name: '临', fullName: '地泽临', shiYao: 2, yingYao: 5, guaCi: '元亨利贞，至于八月有凶', palace: '坤' },
  '坤乾': { name: '泰', fullName: '地天泰', shiYao: 3, yingYao: 6, guaCi: '小往大来，吉亨', palace: '坤' },
  '震乾': { name: '大壮', fullName: '雷天大壮', shiYao: 4, yingYao: 1, guaCi: '利贞', palace: '坤' },
  '兑乾': { name: '夬', fullName: '泽天夬', shiYao: 5, yingYao: 2, guaCi: '扬于王庭，孚号有厉', palace: '坤' },
  '坎乾': { name: '需', fullName: '水天需', shiYao: 4, yingYao: 1, guaCi: '有孚，光亨，贞吉，利涉大川', palace: '坤' },
  '坎坤': { name: '比', fullName: '水地比', shiYao: 3, yingYao: 6, guaCi: '吉。原筮元永贞，无咎', palace: '坤' },

  // ========== 震宫 ==========
  '震震': { name: '震', fullName: '震为雷', shiYao: 6, yingYao: 3, guaCi: '亨。震来虩虩，笑言哑哑', palace: '震' },
  '震坤': { name: '豫', fullName: '雷地豫', shiYao: 1, yingYao: 4, guaCi: '利建侯行师', palace: '震' },
  '震坎': { name: '解', fullName: '雷水解', shiYao: 2, yingYao: 5, guaCi: '利西南，无所往', palace: '震' },
  '震巽': { name: '恒', fullName: '雷风恒', shiYao: 3, yingYao: 6, guaCi: '亨，无咎，利贞，利有攸往', palace: '震' },
  '坤巽': { name: '升', fullName: '地风升', shiYao: 4, yingYao: 1, guaCi: '元亨，用见大人，勿恤', palace: '震' },
  '坎巽': { name: '井', fullName: '水风井', shiYao: 5, yingYao: 2, guaCi: '改邑不改井，无丧无得', palace: '震' },
  '兑巽': { name: '大过', fullName: '泽风大过', shiYao: 4, yingYao: 1, guaCi: '栋桡，利有攸往，亨', palace: '震' },
  '兑震': { name: '随', fullName: '泽雷随', shiYao: 3, yingYao: 6, guaCi: '元亨利贞，无咎', palace: '震' },

  // ========== 巽宫 ==========
  '巽巽': { name: '巽', fullName: '巽为风', shiYao: 6, yingYao: 3, guaCi: '小亨，利有攸往，利见大人', palace: '巽' },
  '巽乾': { name: '小畜', fullName: '风天小畜', shiYao: 1, yingYao: 4, guaCi: '亨。密云不雨，自我西郊', palace: '巽' },
  '巽离': { name: '家人', fullName: '风火家人', shiYao: 2, yingYao: 5, guaCi: '利女贞', palace: '巽' },
  '巽震': { name: '益', fullName: '风雷益', shiYao: 3, yingYao: 6, guaCi: '利有攸往，利涉大川', palace: '巽' },
  '乾震': { name: '无妄', fullName: '天雷无妄', shiYao: 4, yingYao: 1, guaCi: '元亨利贞', palace: '巽' },
  '离震': { name: '噬嗑', fullName: '火雷噬嗑', shiYao: 5, yingYao: 2, guaCi: '亨，利用狱', palace: '巽' },
  '艮震': { name: '颐', fullName: '山雷颐', shiYao: 4, yingYao: 1, guaCi: '贞吉。观颐，自求口实', palace: '巽' },
  '艮巽': { name: '蛊', fullName: '山风蛊', shiYao: 3, yingYao: 6, guaCi: '元亨，利涉大川', palace: '巽' },

  // ========== 坎宫 ==========
  '坎坎': { name: '坎', fullName: '坎为水', shiYao: 6, yingYao: 3, guaCi: '习坎，有孚，维心亨，行有尚', palace: '坎' },
  '坎兑': { name: '节', fullName: '水泽节', shiYao: 1, yingYao: 4, guaCi: '亨。苦节不可贞', palace: '坎' },
  '坎震': { name: '屯', fullName: '水雷屯', shiYao: 2, yingYao: 5, guaCi: '元亨利贞，勿用有攸往', palace: '坎' },
  '坎离': { name: '既济', fullName: '水火既济', shiYao: 3, yingYao: 6, guaCi: '亨小，利贞。初吉终乱', palace: '坎' },
  '兑离': { name: '革', fullName: '泽火革', shiYao: 4, yingYao: 1, guaCi: '巳日乃孚，元亨利贞，悔亡', palace: '坎' },
  '震离': { name: '丰', fullName: '雷火丰', shiYao: 5, yingYao: 2, guaCi: '亨，王假之，勿忧，宜日中', palace: '坎' },
  '坤离': { name: '明夷', fullName: '地火明夷', shiYao: 4, yingYao: 1, guaCi: '利艰贞', palace: '坎' },
  '坤坎': { name: '师', fullName: '地水师', shiYao: 3, yingYao: 6, guaCi: '贞，丈人吉，无咎', palace: '坎' },

  // ========== 离宫 ==========
  '离离': { name: '离', fullName: '离为火', shiYao: 6, yingYao: 3, guaCi: '利贞，亨。畜牝牛，吉', palace: '离' },
  '离艮': { name: '旅', fullName: '火山旅', shiYao: 1, yingYao: 4, guaCi: '小亨，旅贞吉', palace: '离' },
  '离巽': { name: '鼎', fullName: '火风鼎', shiYao: 2, yingYao: 5, guaCi: '元吉，亨', palace: '离' },
  '离坎': { name: '未济', fullName: '火水未济', shiYao: 3, yingYao: 6, guaCi: '亨。小狐汔济，濡其尾，无攸利', palace: '离' },
  '艮坎': { name: '蒙', fullName: '山水蒙', shiYao: 4, yingYao: 1, guaCi: '亨。匪我求童蒙，童蒙求我', palace: '离' },
  '巽坎': { name: '涣', fullName: '风水涣', shiYao: 5, yingYao: 2, guaCi: '亨。王假有庙，利涉大川', palace: '离' },
  '乾坎': { name: '讼', fullName: '天水讼', shiYao: 4, yingYao: 1, guaCi: '有孚，窒惕，中吉，终凶', palace: '离' },
  '乾离': { name: '同人', fullName: '天火同人', shiYao: 3, yingYao: 6, guaCi: '同人于野，亨，利涉大川', palace: '离' },

  // ========== 艮宫 ==========
  '艮艮': { name: '艮', fullName: '艮为山', shiYao: 6, yingYao: 3, guaCi: '艮其背，不获其身', palace: '艮' },
  '艮离': { name: '贲', fullName: '山火贲', shiYao: 1, yingYao: 4, guaCi: '亨，小利有攸往', palace: '艮' },
  '艮乾': { name: '大畜', fullName: '山天大畜', shiYao: 2, yingYao: 5, guaCi: '利贞，不家食吉，利涉大川', palace: '艮' },
  '艮兑': { name: '损', fullName: '山泽损', shiYao: 3, yingYao: 6, guaCi: '有孚，元吉，无咎，可贞', palace: '艮' },
  '离兑': { name: '睽', fullName: '火泽睽', shiYao: 4, yingYao: 1, guaCi: '小事吉', palace: '艮' },
  '乾兑': { name: '履', fullName: '天泽履', shiYao: 5, yingYao: 2, guaCi: '履虎尾，不咥人，亨', palace: '艮' },
  '巽兑': { name: '中孚', fullName: '风泽中孚', shiYao: 4, yingYao: 1, guaCi: '豚鱼吉，利涉大川，利贞', palace: '艮' },
  '巽艮': { name: '渐', fullName: '风山渐', shiYao: 3, yingYao: 6, guaCi: '女归吉，利贞', palace: '艮' },

  // ========== 兑宫 ==========
  '兑兑': { name: '兑', fullName: '兑为泽', shiYao: 6, yingYao: 3, guaCi: '亨，利贞', palace: '兑' },
  '兑坎': { name: '困', fullName: '泽水困', shiYao: 1, yingYao: 4, guaCi: '亨，贞，大人吉，无咎', palace: '兑' },
  '兑坤': { name: '萃', fullName: '泽地萃', shiYao: 2, yingYao: 5, guaCi: '亨。王假有庙，利见大人，亨', palace: '兑' },
  '兑艮': { name: '咸', fullName: '泽山咸', shiYao: 3, yingYao: 6, guaCi: '亨，利贞，取女吉', palace: '兑' },
  '坎艮': { name: '蹇', fullName: '水山蹇', shiYao: 4, yingYao: 1, guaCi: '利西南，不利东北', palace: '兑' },
  '坤艮': { name: '谦', fullName: '地山谦', shiYao: 5, yingYao: 2, guaCi: '亨，君子有终', palace: '兑' },
  '震艮': { name: '小过', fullName: '雷山小过', shiYao: 4, yingYao: 1, guaCi: '亨，利贞，可小事，不可大事', palace: '兑' },
  '震兑': { name: '归妹', fullName: '雷泽归妹', shiYao: 3, yingYao: 6, guaCi: '征凶，无攸利', palace: '兑' },
}

// ==================== 六神排列 ====================

/**
 * 根据日干排六神
 * 甲乙日起青龙，丙丁日起朱雀，戊日起勾陈，己日起螣蛇，庚辛日起白虎，壬癸日起玄武
 */
export function getLiuShenByDay(riGan: string): LiuShen[] {
  const startMap: Record<string, LiuShen> = {
    '甲': '青龙', '乙': '青龙',
    '丙': '朱雀', '丁': '朱雀',
    '戊': '勾陈',
    '己': '螣蛇',
    '庚': '白虎', '辛': '白虎',
    '壬': '玄武', '癸': '玄武'
  }
  const allLiuShen: LiuShen[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']
  const start = allLiuShen.indexOf(startMap[riGan] || '青龙')
  const result: LiuShen[] = []
  for (let i = 0; i < 6; i++) {
    result.push(allLiuShen[(start + i) % 6])
  }
  return result
}

// ==================== 六亲推算 ====================

/**
 * 根据卦宫五行和爻地支推算六亲
 */
export function getLiuQin(guaWuXing: '金' | '木' | '水' | '火' | '土', yaoWuXing: '金' | '木' | '水' | '火' | '土'): LiuQin {
  const SHENG: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }
  const KE: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' }

  if (guaWuXing === yaoWuXing) return '兄弟'
  if (SHENG[guaWuXing] === yaoWuXing) return '子孙'
  if (SHENG[yaoWuXing] === guaWuXing) return '父母'
  if (KE[guaWuXing] === yaoWuXing) return '妻财'
  return '官鬼'
}

/** 地支五行 */
const ZHI_WUXING: Record<string, '金' | '木' | '水' | '火' | '土'> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// ==================== 核心算法 ====================

/**
 * 摇卦 - 生成6个爻值
 * 6=老阴(变阳), 7=少阳, 8=少阴, 9=老阳(变阴)
 */
export function yaoGua(): number[] {
  const result: number[] = []
  for (let i = 0; i < 6; i++) {
    // 模拟三枚铜钱
    let sum = 0
    for (let j = 0; j < 3; j++) {
      sum += Math.random() < 0.5 ? 2 : 3  // 2=阴面, 3=阳面
    }
    result.push(sum)  // 6,7,8,9
  }
  return result
}

/**
 * 根据爻值获取阴阳
 */
export function getYinYang(value: number): '阳' | '阴' {
  return (value === 7 || value === 9) ? '阳' : '阴'
}

/**
 * 判断是否动爻
 */
export function isDongYao(value: number): boolean {
  return value === 6 || value === 9
}

/**
 * 获取变爻阴阳
 */
export function getBianYinYang(value: number): '阳' | '阴' {
  return value === 6 ? '阳' : '阴'  // 老阴变阳
}

/**
 * 根据6个爻值确定上下卦
 */
export function getGuaFromYao(values: number[]): { upper: string; lower: string } {
  // 下卦：初爻到三爻
  const lowerYao = values.slice(0, 3).map(v => getYinYang(v) === '阳' ? 1 : 0)
  // 上卦：四爻到上爻
  const upperYao = values.slice(3, 6).map(v => getYinYang(v) === '阳' ? 1 : 0)

  // 二进制转八卦：阳=1, 阴=0，从下往上
  const guaMap: Record<string, string> = {
    '111': '乾', '110': '兑', '101': '离', '100': '震',
    '011': '巽', '010': '坎', '001': '艮', '000': '坤'
  }

  const lowerKey = lowerYao.join('')
  const upperKey = upperYao.join('')

  return {
    upper: guaMap[upperKey] || '乾',
    lower: guaMap[lowerKey] || '乾'
  }
}

/**
 * 获取卦数据
 */
export function getGua64(upper: string, lower: string): Gua64 {
  const key = upper + lower
  const data = GUA64_DATA[key] || GUA64_DATA['乾乾'] // 默认乾卦

  return {
    name: data.name,
    fullName: data.fullName,
    upper,
    lower,
    shiYao: data.shiYao,
    yingYao: data.yingYao,
    guaCi: data.guaCi,
    yaoCi: [] // TODO: 补充爻辞
  }
}

/**
 * 完整六爻排盘
 */
export function liuYaoPaiPan(question: string, yaoValues?: number[]): LiuYaoResult {
  const values = Array.isArray(yaoValues) && yaoValues.length === 6
    ? yaoValues.map(value => [6, 7, 8, 9].includes(value) ? value : 7)
    : yaoGua()
  const gua = getGuaFromYao(values)
  const benGua = getGua64(gua.upper, gua.lower)
  const guaWuXing = GUA_WUXING[benGua.upper]

  const now = new Date()
  const riGan = '甲' // 简化：用当前日干
  const liuShenList = getLiuShenByDay(riGan)

  const dongYao: number[] = []
  const yaoList: Yao[] = values.map((v, i) => {
    const isDong = isDongYao(v)
    if (isDong) dongYao.push(i + 1)

    const zhi = NAJIA_TABLE[benGua.upper]?.zhi[i] || '子'
    const yaoWuXing = ZHI_WUXING[zhi]

    return {
      position: i + 1,
      yinYang: getYinYang(v),
      isDong,
      bianYinYang: isDong ? getBianYinYang(v) : undefined,
      liuQin: getLiuQin(guaWuXing, yaoWuXing),
      liuShen: liuShenList[i],
      diZhi: zhi,
      name: YAO_NAMES[i]
    }
  })

  // 计算变卦
  let bianGua: Gua64 | undefined
  if (dongYao.length > 0) {
    const bianValues = values.map(v => isDongYao(v) ? (v === 6 ? 9 : 6) : v)
    const bianGuaNames = getGuaFromYao(bianValues)
    bianGua = getGua64(bianGuaNames.upper, bianGuaNames.lower)
  }

  return {
    benGua,
    bianGua,
    yaoList,
    dongYao,
    riGanZhi: riGan + '子', // 简化
    riWuXing: '木',
    question,
    time: now.toLocaleString('zh-CN')
  }
}
