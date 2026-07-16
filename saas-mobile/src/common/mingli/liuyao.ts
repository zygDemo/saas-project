/**
 * 六爻排盘核心算法
 * 包含：摇卦、纳甲、六亲、六神、世应
 */

import { getDayZhu, GAN_WUXING, type WuXing } from './bazi'

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
  dongYaoDetail?: DongYaoDetail[]  // 动爻详解
  guaXiang?: GuaXiang   // 卦象图形
}

/** 动爻详解 */
export interface DongYaoDetail {
  position: number      // 爻位
  name: string          // 爻名
  yinYang: '阳' | '阴'  // 原爻
  bianYinYang: '阳' | '阴'  // 变爻
  liuQin: LiuQin        // 六亲
  meaning: string       // 含义解读
}

/** 卦象图形数据 */
export interface GuaXiang {
  upper: boolean[]      // 上卦三爻 (true=阳, false=阴)
  lower: boolean[]      // 下卦三爻
  upperName: string     // 上卦名
  lowerName: string     // 下卦名
}

// ==================== 八卦纳甲 ====================

/**
 * 八卦纳甲表
 * 每卦配天干和三爻地支（从初爻到上爻）
 */
const NAJIA_TABLE: Record<string, { gan: string; zhi: string[] }> = {
  '乾': { gan: '甲', zhi: ['子', '寅', '辰'] },
  '坤': { gan: '乙', zhi: ['未', '巳', '卯'] },
  '震': { gan: '庚', zhi: ['子', '寅', '辰'] },
  '巽': { gan: '辛', zhi: ['丑', '亥', '酉'] },
  '坎': { gan: '戊', zhi: ['寅', '辰', '午'] },
  '离': { gan: '己', zhi: ['卯', '丑', '亥'] },
  '艮': { gan: '丙', zhi: ['辰', '午', '申'] },
  '兑': { gan: '丁', zhi: ['巳', '卯', '丑'] }
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
 * 六十四卦爻辞（每卦6条，从初爻到上爻）
 */
const YAO_CI_TABLE: Record<string, string[]> = {
  // ========== 乾宫 ==========
  '乾乾': ['潜龙勿用', '见龙在田，利见大人', '君子终日乾乾，夕惕若厉，无咎', '或跃在渊，无咎', '飞龙在天，利见大人', '亢龙有悔'],
  '乾巽': ['系于金柵，贞吉', '包有鱼，无咎，不利宾', '臀无肤，其行次且，厉，无大咎', '包无鱼，起凶', '以杞包瓜，含章，有陨自天', '姤其角，吝，无咎'],
  '乾艮': ['遁尾，厉，勿用有攸往', '执之用黄牛之革，莫之胜说', '系遁，有疾厉，畜臣妾吉', '好遁，君子吉，小人否', '嘉遁，贞吉', '肥遁，无不利'],
  '乾坤': ['拔茅茹以其汇，贞吉，亨', '包承，小人吉，大人否，亨', '包羞', '有命，无咎，畴离祉', '休否，大人吉，其亡其亡，系于苞桑', '倾否，先否后喜'],
  '巽坤': ['童观，小人无咎，君子吝', '窥观，利女贞', '观我生，进退', '观国之光，利用宾于王', '观我生，君子无咎', '观其生，君子无咎'],
  '艮坤': ['剥床以足，蔑贞凶', '剥床以辨，蔑贞凶', '剥之，无咎', '剥床以肤，凶', '贯鱼以宫人宠，无不利', '硕果不食，君子得舆，小人剥庐'],
  '离坤': ['晋如摧如，贞吉，罔孚裕无咎', '晋如愁如，贞吉，受兹介福于其王母', '众允，悔亡', '晋如鼫鼠，贞厉', '悔亡，失得勿恤，往吉，无不利', '晋其角，维用伐邑，厉吉，无咎'],
  '离乾': ['无交害，匪咎，艰则无咎', '大车以载，有攸往，无咎', '公用亨于天子，小人弗克', '匪其彭，无咎', '厥孚交如威如，吉', '自天祐之，吉，无不利'],
  // ========== 坤宫 ==========
  '坤坤': ['履霜，坚冰至', '直方大，不习无不利', '含章可贞，或从王事，无成有终', '括囊，无咎无誉', '黄裳，元吉', '龙战于野，其血玄黄'],
  '坤震': ['不远复，无祗悔，元吉', '休复，吉', '频复，厉，无咎', '中行独复', '敦复，无悔', '迷复，凶，有灾眚'],
  '坤兑': ['咸临，贞吉', '咸临，吉，无不利', '甘临，无攸利，既忧之，无咎', '至临，无咎', '知临，大君之宜，吉', '敦临，吉，无咎'],
  '坤乾': ['拔茅茹以其汇，征吉', '包荒，用冯河，不遐遗，朋亡，得尚于中行', '无平不陂，无往不复，艰贞无咎', '翩翩，不富以其邻，不戒以孚', '帝乙归妹，以祉元吉', '城复于隍，勿用师，自邑告命，贞吝'],
  '震乾': ['壮于趾，征凶，有孚', '贞吉', '小人用壮，君子用罔，贞厉，羝羊触藩，羸其角', '贞吉，悔亡，藩决不羸，壮于大舆之輹', '丧羊于易，无悔', '羝羊触藩，不能退，不能遂，无攸利，艰则吉'],
  '兑乾': ['壮于前趾，往不胜为咎', '惕号，莫夜有戎，勿恤', '壮于頄，有凶，君子夬夬独行，遇雨若濡，有愠无咎', '臀无肤，其行次且，牵羊悔亡，闻言不信', '苋陆夬夬，中行无咎', '无号，终有凶'],
  '坎乾': ['需于郊，利用恒，无咎', '需于沙，小有言，终吉', '需于泥，致寇至', '需于血，出自穴', '需于酒食，贞吉', '入于穴，有不速之客三人来，敬之终吉'],
  '坎坤': ['有孚比之，无咎，有孚盈缶，终来有它吉', '比之自内，贞吉', '比之匪人', '外比之，贞吉', '显比，王用三驱，失前禽，邑人不诫，吉', '比之无首，凶'],
  // ========== 震宫 ==========
  '震震': ['震来虩虩，后笑言哑哑，吉', '震来厉，亿丧贝，跻于九陵，勿逐，七日得', '震苏苏，震行无眚', '震遂泥', '震往来厉，亿无丧，有事', '震索索，视矍矍，征凶，震不于其躬，于其邻，无咎，婚媾有言'],
  '震坤': ['鸣豫，凶', '介于石，不终日，贞吉', '盱豫，悔，迟有悔', '由豫，大有得，勿疑，朋盍簪', '贞疾，恒不死', '冥豫，成有渝，无咎'],
  '震坎': ['无咎', '田获三狐，得黄矢，贞吉', '负且乘，致寇至，贞吝', '解而拇，朋至斯孚', '君子维有解，吉，有孚于小人', '公用射隼于高墉之上，获之，无不利'],
  '震巽': ['浚恒，贞凶，无攸利', '悔亡', '不恒其德，或承之羞，贞吝', '田无禽', '恒其德，贞，妇人吉，夫子凶', '振恒，凶'],
  '坤巽': ['允升，大吉', '孚乃利用禴，无咎', '升虚邑', '王用亨于岐山，吉，无咎', '贞吉，升阶', '冥升，利于不息之贞'],
  '坎巽': ['井泥不食，旧井无禽', '井谷射鲋，瓮敝漏', '井渫不食，为我心恻，可用汲，王明，并受其福', '井甃，无咎', '井冽寒泉，食', '井收勿幕，有孚，元吉'],
  '兑巽': ['藉用白茅，无咎', '枯杨生稊，老夫得其女妻，无不利', '栋桡，凶', '栋隆，吉，有它吝', '枯杨生华，老妇得其士夫，无咎无誉', '过涉灭顶，凶，无咎'],
  '兑震': ['官有渝，贞吉，出门交有功', '系小子，失丈夫', '系丈夫，失小子，随有求得，利居贞', '随有获，贞凶，有孚在道，以明，何咎', '孚于嘉，吉', '拘系之，乃从维之，王用亨于西山'],
  // ========== 巽宫 ==========
  '巽巽': ['进退，利武人之贞', '巽在床下，用史巫纷若，吉，无咎', '频巽，吝', '悔亡，田获三品', '贞吉，悔亡，无不利，无初有终', '巽在床下，丧其资斧，贞凶'],
  '巽乾': ['复自道，何其咎，吉', '牵复，吉', '舆说辐，夫妻反目', '有孚，血去惕出，无咎', '有孚挛如，富以其邻', '既雨既处，尚德载，妇贞厉，月几望，君子征凶'],
  '巽离': ['闲有家，悔亡', '无攸遂，在中馈，贞吉', '家人嗃嗃，悔厉吉，妇子嘻嘻，终吝', '富家，大吉', '王假有家，勿恤，吉', '有孚威如，终吉'],
  '巽震': ['利用为大作，元吉，无咎', '或益之十朋之龟，弗克违，永贞吉，王用享于帝，吉', '益之用凶事，无咎，有孚中行，告公用圭', '中行告公从，利用为依迁国', '有孚惠心，勿问，元吉，有孚惠我德', '莫益之，或击之，立心勿恒，凶'],
  '乾震': ['无妄，往吉', '不耕获，不菑畲，则利有攸往', '无妄之灾，或系之牛，行人之得，邑人之灾', '可贞，无咎', '无妄之疾，勿药有喜', '无妄，行有眚，无攸利'],
  '离震': ['屦校灭趾，无咎', '噬肤灭鼻，无咎', '噬腊肉，遇毒，小吝，无咎', '噬干胏，得金矢，利艰贞，吉', '噬干肉，得黄金，贞厉，无咎', '何校灭耳，凶'],
  '艮震': ['舍尔灵龟，观我朵颐，凶', '颠颐，拂经于丘颐，征凶', '拂颐，贞凶，十年勿用，无攸利', '颠颐，吉，虎视眈眈，其欲逐逐，无咎', '拂经，居贞吉，不可涉大川', '由颐，厉吉，利涉大川'],
  '艮巽': ['干父之蛊，有子，考无咎，厉终吉', '干母之蛊，不可贞', '干父之蛊，小有悔，无大咎', '裕父之蛊，往见吝', '干父之蛊，用誉', '不事王侯，高尚其事'],
  // ========== 坎宫 ==========
  '坎坎': ['习坎，入于坎窞，凶', '坎有险，求小得', '来之坎坎，险且枕，入于坎窞，勿用', '樽酒簋贰，用缶，纳约自牖，终无咎', '坎不盈，祗既平，无咎', '系用徽纆，寘于丛棘，三岁不得，凶'],
  '坎兑': ['不出户庭，无咎', '不出门庭，凶', '不节若，则嗟若，无咎', '安节，亨', '甘节，吉，往有尚', '苦节，贞凶，悔亡'],
  '坎震': ['磐桓，利居贞，利建侯', '屯如邅如，乘马班如，匪寇，婚媾，女子贞不字，十年乃字', '即鹿无虞，惟入于林中，君子几不如舍，往吝', '乘马班如，求婚媾，往吉，无不利', '屯其膏，小贞吉，大贞凶', '乘马班如，泣血涟如'],
  '坎离': ['曳其轮，濡其尾，无咎', '妇丧其茀，勿逐，七日得', '高宗伐鬼方，三年克之，小人勿用', '繻有衣袽，终日戒', '东邻杀牛，不如西邻之禴祭，实受其福', '濡其首，厉'],
  '兑离': ['巩用黄牛之革', '巳日乃革之，征吉，无咎', '征凶，贞厉，革言三就，有孚', '悔亡，有孚改命，吉', '大人虎变，未占有孚', '君子豹变，小人革面，征凶，居贞吉'],
  '震离': ['遇其配主，虽旬无咎，往有尚', '丰其蔀，日中见斗，往得疑疾，有孚发若，吉', '丰其沛，日中见沬，折其右肱，无咎', '丰其蔀，日中见斗，遇其夷主，吉', '来章，有庆誉，吉', '丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶'],
  '坤离': ['明夷于飞，垂其翼，君子于行，三日不食，有攸往，主人有言', '明夷，夷于左股，用拯马壮，吉', '明夷于南狩，得其大首，不可疾贞', '入于左腹，获明夷之心，出于门庭', '箕子之明夷，利贞', '不明，晦，初登于天，后入于地'],
  '坤坎': ['师出以律，否臧凶', '在师中，吉，无咎，王三锡命', '师或舆尸，凶', '师左次，无咎', '田有禽，利执言，无咎，长子帅师，弟子舆尸，贞凶', '大君有命，开国承家，小人勿用'],
  // ========== 离宫 ==========
  '离离': ['履错然，敬之，无咎', '黄离，元吉', '日昃之离，不鼓缶而歌，则大耋之嗟，凶', '突如其来如，焚如，死如，弃如', '出涕沱若，戚嗟若，吉', '王用出征，有嘉折首，获匪其丑，无咎'],
  '离艮': ['旅琐琐，斯其所取灾', '旅即次，怀其资，得童仆，贞', '旅焚其次，丧其童仆，贞厉', '旅于处，得其资斧，我心不快', '射雉，一矢亡，终以誉命', '鸟焚其巢，旅人先笑后号咷，丧牛于易，凶'],
  '离巽': ['鼎颠趾，利出否，得妾以其子，无咎', '鼎有实，我仇有疾，不我能即，吉', '鼎耳革，其行塞，雉膏不食，方雨亏悔，终吉', '鼎折足，覆公餗，其形渥，凶', '鼎黄耳金铉，利贞', '鼎玉铉，大吉，无不利'],
  '离坎': ['濡其尾，吝', '曳其轮，贞吉', '未济，征凶，利涉大川', '贞吉，悔亡，震用伐鬼方，三年有赏于大国', '贞吉，无悔，君子之光，有孚，吉', '有孚于饮酒，无咎，濡其首，有孚失是'],
  '艮坎': ['发蒙，利用刑人，用说桎梏，以往吝', '包蒙吉，纳妇吉，子克家', '勿用取女，见金夫，不有躬，无攸利', '困蒙，吝', '童蒙，吉', '击蒙，不利为寇，利御寇'],
  '巽坎': ['用拯马壮，吉', '涣奔其机，悔亡', '涣其躬，无悔', '涣其群，元吉，涣有丘，匪夷所思', '涣汗其大号，涣王居，无咎', '涣其血去逖出，无咎'],
  '乾坎': ['不永所事，小有言，终吉', '不克讼，归而逋，其邑人三百户，无眚', '食旧德，贞厉，终吉', '不克讼，复即命，渝，安贞吉', '讼，元吉', '或锡之鞶带，终朝三褫之'],
  '乾离': ['同人于门，无咎', '同人于宗，吝', '伏戎于莽，升其高陵，三岁不兴', '乘其墉，弗克攻，吉', '同人先号咷而后笑，大师克相遇', '同人于郊，无悔'],
  // ========== 艮宫 ==========
  '艮艮': ['艮其趾，无咎，利永贞', '艮其腓，不拯其随，其心不快', '艮其限，列其夤，厉薰心', '艮其身，无咎', '艮其辅，言有序，悔亡', '敦艮，吉'],
  '艮离': ['贲其趾，舍车而徒', '贲其须', '贲如濡如，永贞吉', '贲如皤如，白马翰如，匪寇，婚媾', '贲于丘园，束帛戋戋，吝，终吉', '白贲，无咎'],
  '艮乾': ['有厉，利巳', '舆说輹', '良马逐，利艰贞，曰闲舆卫，利有攸往', '童牛之牿，元吉', '豶豕之牙，吉', '何天之衢，亨'],
  '艮兑': ['巳事遄往，无咎，酌损之', '利贞，征凶，弗损益之', '三人行则损一人，一人行则得其友', '损其疾，使遄有喜，无咎', '或益之十朋之龟，弗克违，元吉', '弗损益之，无咎，贞吉，利有攸往，得臣无家'],
  '离兑': ['悔亡，丧马勿逐，自复，见恶人，无咎', '遇主于巷，无咎', '见舆曳，其牛掣，其人天且劓，无初有终', '睽孤，遇元夫，交孚，厉，无咎', '悔亡，厥宗噬肤，往何咎', '睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧，匪寇，婚媾，往遇雨则吉'],
  '乾兑': ['素履，往无咎', '履道坦坦，幽人贞吉', '眇能视，跛能履，履虎尾，咥人凶，武人为于大君', '履虎尾，愬愬，终吉', '夬履，贞厉', '视履考祥，其旋元吉'],
  '巽兑': ['虞吉，有它不燕', '鸣鹤在阴，其子和之，我有好爵，吾与尔靡之', '得敌，或鼓或罢，或泣或歌', '月几望，马匹亡，无咎', '有孚挛如，无咎', '翰音登于天，贞凶'],
  '巽艮': ['鸿渐于干，小子厉，有言，无咎', '鸿渐于磐，饮食衎衎，吉', '鸿渐于陆，夫征不复，妇孕不育，凶，利御寇', '鸿渐于木，或得其桷，无咎', '鸿渐于陵，妇三岁不孕，终莫之胜，吉', '鸿渐于逵，其羽可用为仪，吉'],
  // ========== 兑宫 ==========
  '兑兑': ['和兑，吉', '孚兑，吉，悔亡', '来兑，凶', '商兑未宁，介疾有喜', '孚于剥，有厉', '引兑'],
  '兑坎': ['臀困于株木，入于幽谷，三岁不觌', '困于酒食，朱绂方来，利用享祀，征凶，无咎', '困于石，据于蒺藜，入其宫，不见其妻，凶', '来徐徐，困于金车，吝，有终', '劓刖，困于赤绂，乃徐有说，利用祭祀', '困于葛藟，于臲卼，曰动悔，有悔，征吉'],
  '兑坤': ['萃有位，无咎，匪孚，元永贞，悔亡', '引吉，无咎，孚乃利用禴', '萃如嗟如，无攸利，往无咎，小吝', '大吉，无咎', '萃有位，无咎，匪孚', '赍咨涕洟，无咎'],
  '兑艮': ['咸其拇', '咸其腓，凶，居吉', '咸其股，执其随，往吝', '贞吉，悔亡，憧憧往来，朋从尔思', '咸其脢，无悔', '咸其辅颊舌'],
  '坎艮': ['往蹇，来誉', '王臣蹇蹇，匪躬之故', '往蹇，来反', '往蹇，来连', '大蹇，朋来', '往蹇，来硕，吉，利见大人'],
  '坤艮': ['谦谦君子，用涉大川，吉', '鸣谦，贞吉', '劳谦，君子有终，吉', '无不利，撝谦', '不富以其邻，利用侵伐，无不利', '鸣谦，利用行师，征邑国'],
  '震艮': ['飞鸟以凶', '过其祖，遇其妣，不及其君，遇其臣，无咎', '弗过防之，从或戕之，凶', '无咎，弗过遇之，往厉必戒，勿用永贞', '密云不雨，自我西郊，公弋取彼在穴', '弗遇过之，飞鸟离之，凶，是谓灾眚'],
  '震兑': ['归妹以娣，跛能履，征吉', '眇能视，利幽人之贞', '归妹以须，反归以娣', '归妹愆期，迟归有时', '帝乙归妹，其君之袂不如其娣之袂良，月几望，吉', '女承筐无实，士刲羊无血，无攸利'],
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
    yaoCi: YAO_CI_TABLE[key] || YAO_CI_TABLE['乾乾'] || []
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

  // 使用真实日干支
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

    // 纳甲：下卦(初爻-三爻)用 lower 的 zhi[0-2]，上卦(四爻-上爻)用 upper 的 zhi[0-2]
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

  // 获取卦象图形
  const guaXiang = getGuaXiang(values, gua.upper, gua.lower)

  // 获取动爻详解
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
  const meanings: Record<string, Record<string, string>> = {
    '父母': {
      '阳变阴': '长辈关系有变，文书契约需谨慎',
      '阴变阳': '家庭事务好转，学业有成',
    },
    '兄弟': {
      '阳变阴': '朋友关系变化，竞争加剧',
      '阴变阳': '人脉拓展，合作共赢',
    },
    '子孙': {
      '阳变阴': '子女事务需关注，投资需谨慎',
      '阴变阳': '后代有喜，创意灵感涌现',
    },
    '妻财': {
      '阳变阴': '财运波动，感情有变',
      '阴变阳': '财源广进，感情升温',
    },
    '官鬼': {
      '阳变阴': '工作压力减轻，疾病好转',
      '阴变阳': '事业有突破，但需防小人',
    },
  }

  return dongYao.map(pos => {
    const yao = yaoList[pos - 1]
    const yinYang = yao.yinYang
    const bianYinYang = yao.bianYinYang || (yinYang === '阳' ? '阴' : '阳')
    const key = `${yinYang}变${bianYinYang}`
    const meaning = meanings[yao.liuQin]?.[key] || '此爻变化，需结合卦辞综合判断'

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
