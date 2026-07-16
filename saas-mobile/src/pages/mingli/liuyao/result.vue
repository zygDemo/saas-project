<template>
  <view :class="['page', themeClass]">
    <view class="hero">
      <mystic-sky />
      <view class="topbar">
        <view class="capsule">
          <view class="capsule-left" hover-class="tap-active" @tap="goBack"><text>‹</text></view>
          <view class="capsule-divider" />
          <view class="capsule-mid" hover-class="tap-active" @tap="goHome"><text class="home-icon">⌂</text></view>
          <view class="capsule-divider" />
          <view class="capsule-right" hover-class="tap-active" @tap="goHistory">
            <text>星卷</text>
            <text class="history-count">{{ historyCount }}</text>
          </view>
        </view>
      </view>

      <view v-if="result" class="hero-content">
        <text class="eyebrow">ORIENTAL ASTROLOGY</text>
        <text class="question">{{ result.question || '心中所问' }}</text>
        <view class="gua-ring">
          <view class="gua-halo gua-halo-a" /><view class="gua-halo gua-halo-b" />
          <text class="gua-name">{{ result.benGua.name }}</text>
          <text class="gua-full">{{ result.benGua.fullName }}</text>
        </view>
        <text class="ri-info">日：{{ result.riGanZhi }} · {{ result.riWuXing }}</text>
      </view>
    </view>

    <view v-if="result" class="paper-body">
      <view class="section-title"><text>✦</text><view><text class="title-main">卦象详情</text><text class="title-sub">{{ result.benGua.fullName }}</text></view><text>✦</text></view>

      <view class="yao-table">
        <view class="yao-header">
          <text class="col-shen">六神</text>
          <text class="col-qin">六亲</text>
          <text class="col-gua">卦</text>
          <text class="col-yao">爻</text>
          <text class="col-zhi">地支</text>
          <text class="col-bian">变</text>
        </view>
        <view v-for="(yao, index) in result.yaoList" :key="index" class="yao-row" :class="{ dong: yao.isDong, shi: index + 1 === result.benGua.shiYao, ying: index + 1 === result.benGua.yingYao }">
          <text class="col-shen">{{ yao.liuShen }}</text>
          <text class="col-qin">{{ yao.liuQin }}</text>
          <text class="col-gua">{{ getGuaName(index) }}</text>
          <view class="col-yao">
            <view class="yao-line" :class="{ yang: yao.yinYang === '阳', broken: yao.yinYang === '阴' }" />
            <text v-if="yao.isDong" class="dong-mark">○</text>
          </view>
          <text class="col-zhi">{{ yao.diZhi }}</text>
          <view class="col-bian">
            <view v-if="yao.isDong" class="yao-line yang" :class="{ broken: yao.bianYinYang === '阴' }" />
          </view>
        </view>
      </view>

      <!-- 卦象图形 -->
      <view v-if="result.guaXiang" class="gua-xiang-card">
        <view class="card-heading"><view><text class="card-title">卦象图示</text><text class="card-subtitle">本卦{{ result.benGua.fullName }}</text></view><text class="card-mark">卦</text></view>
        <view class="gua-xiang-content">
          <view class="gua-xiang-part">
            <text class="gua-xiang-label">{{ result.guaXiang.upperName }}</text>
            <view class="gua-xiang-lines">
              <view v-for="(isYang, i) in result.guaXiang.upper" :key="'u'+i" class="gua-xiang-line" :class="{ yang: isYang, dong: isDongLine(i + 3) }">
                <view v-if="isYang" class="line-solid" />
                <view v-else class="line-broken"><view /><view /></view>
                <text v-if="isDongLine(i + 3)" class="dong-icon">○</text>
              </view>
            </view>
          </view>
          <view class="gua-xiang-divider" />
          <view class="gua-xiang-part">
            <text class="gua-xiang-label">{{ result.guaXiang.lowerName }}</text>
            <view class="gua-xiang-lines">
              <view v-for="(isYang, i) in result.guaXiang.lower" :key="'l'+i" class="gua-xiang-line" :class="{ yang: isYang, dong: isDongLine(i) }">
                <view v-if="isYang" class="line-solid" />
                <view v-else class="line-broken"><view /><view /></view>
                <text v-if="isDongLine(i)" class="dong-icon">○</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 动爻详解 -->
      <view v-if="result.dongYaoDetail?.length" class="dongyao-card">
        <view class="card-heading"><view><text class="card-title">动爻详解</text><text class="card-subtitle">变化中的玄机</text></view><text class="card-mark">变</text></view>
        <view class="dongyao-list">
          <view v-for="(item, index) in result.dongYaoDetail" :key="index" class="dongyao-item">
            <view class="dongyao-header">
              <text class="dongyao-pos">{{ item.name }}</text>
              <text class="dongyao-liuqin">{{ item.liuQin }}</text>
              <view class="dongyao-change">
                <view class="yao-line-sm" :class="{ yang: item.yinYang === '阳' }" />
                <text class="change-arrow">→</text>
                <view class="yao-line-sm" :class="{ yang: item.bianYinYang === '阳' }" />
              </view>
            </view>
            <text class="dongyao-meaning">{{ item.meaning }}</text>
          </view>
        </view>
      </view>

      <view class="gua-meaning">
        <text class="meaning-title">卦辞</text>
        <text class="meaning-text">{{ result.benGua.guaCi }}</text>
      </view>

      <view v-if="result.bianGua" class="bian-section">
        <text class="bian-title">变卦：{{ result.bianGua.fullName }}</text>
      </view>

      <view class="insight-card">
        <text class="insight-star">✧</text>
        <view>
          <text class="insight-title">卦意启示</text>
          <text class="insight-text">{{ getInsight() }}</text>
        </view>
      </view>

      <button class="again-btn" hover-class="tap-active" @tap="again">重新摇卦</button>
      <text class="disclaimer">传统文化推演结果仅供参考，请理性看待</text>
    </view>

    <view v-else class="empty">
      <text>卦象未能展开</text>
      <button @tap="again">重新摇卦</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { liuYaoPaiPan, type LiuYaoResult } from '@/common/mingli/liuyao'
import { getMingliHistory, getMingliRecord, saveMingliRecord } from '@/common/mingli/history'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'
import { useMingliTheme } from '../theme'

const result = ref<LiuYaoResult | null>(null)
const historyCount = ref(0)
const { themeClass } = useMingliTheme()

onShow(() => {
  historyCount.value = getMingliHistory().length
})

const goHome = () => uni.reLaunch({ url: APP_ROUTES.portal.home })
function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}
const goHistory = () => uni.navigateTo({ url: APP_ROUTES.mingli.history })

function getGuaName(index: number): string {
  if (!result.value) return ''
  return index < 3 ? result.value.benGua.lower : result.value.benGua.upper
}

function isDongLine(index: number): boolean {
  return result.value?.dongYao?.includes(index + 1) || false
}

function getInsight(): string {
  if (!result.value) return ''
  const gua = result.value.benGua.name
  const insights: Record<string, string> = {
    '乾': '乾卦象征天，刚健中正，是大吉之卦。事业亨通，但需保持谦逊。',
    '坤': '坤卦象征地，柔顺承载，厚德载物。宜守正道，静待时机。',
    '屯': '屯卦象征初生，万事开头难。坚持不懈，终会突破困境。',
    '蒙': '蒙卦象征启蒙，虚心学习。寻求指引，开启智慧。',
    '需': '需卦象征等待，耐心守候。时机未到，蓄势待发。',
    '讼': '讼卦象征争讼，慎防口舌。退一步海阔天空。',
    '师': '师卦象征军队，纪律严明。带领团队，需有章法。',
    '比': '比卦象征亲近，和睦相处。真诚待人，获得支持。',
    '小畜': '小畜象征蓄养，积少成多。循序渐进，厚积薄发。',
    '履': '履卦象征践行，谨慎前行。如履薄冰，方能安稳。',
    '泰': '泰卦象征通泰，天地交感。国泰民安，万事亨通。',
    '否': '否卦象征闭塞，暂时困难。韬光养晦，等待转机。',
    '同人': '同人象征同心，志同道合。团结协作，共创未来。',
    '大有': '大有象征丰盛，事业有成。保持谦逊，福泽绵长。',
    '谦': '谦卦象征谦逊，美德之卦。虚怀若谷，无往不利。',
    '豫': '豫卦象征愉悦，顺势而为。把握时机，积极行动。',
    '随': '随卦象征随顺，灵活应变。顺应时势，随机应变。',
    '蛊': '蛊卦象征整治，革故鼎新。整顿秩序，重新出发。',
    '临': '临卦象征临近，亲力亲为。深入基层，方得真知。',
    '观': '观卦象征观察，审时度势。静观其变，洞察本质。',
    '噬嗑': '噬嗑象征决断，明辨是非。果断处理，扫除障碍。',
    '贲': '贲卦象征文饰，注重形式。内外兼修，锦上添花。',
    '剥': '剥卦象征剥落，暂时衰退。保存实力，静待复兴。',
    '复': '复卦象征回归，否极泰来。重新出发，希望在前。',
    '无妄': '无妄象征真实，顺其自然。脚踏实地，不妄想妄求。',
    '大畜': '大畜象征积蓄，厚积薄发。充实自我，等待时机。',
    '颐': '颐卦象征养育，修身养性。注意言行，涵养德行。',
    '大过': '大过象征非常，需谨慎行。非常之时，需非常之策。',
    '坎': '坎卦象征险阻，重重困难。临危不惧，方能脱险。',
    '离': '离卦象征光明，依附正道。明照四方，前途光明。',
    '咸': '咸卦象征感应，心灵相通。真诚交流，增进感情。',
    '恒': '恒卦象征恒久，持之以恒。坚守正道，终获成功。',
    '遁': '遁卦象征退避，适时隐退。保存实力，以待时机。',
    '大壮': '大壮象征强盛，刚健有力。适可而止，过犹不及。',
    '晋': '晋卦象征晋升，前途光明。积极进取，步步高升。',
    '明夷': '明夷象征韬光，暂时隐忍。暗中积蓄，等待黎明。',
    '家人': '家人象征家庭，和睦相处。齐家治国，以身作则。',
    '睽': '睽卦象征乖离，意见分歧。求同存异，化解矛盾。',
    '蹇': '蹇卦象征艰难，举步维艰。寻求帮助，共渡难关。',
    '解': '解卦象征化解，困难解除。把握时机，轻装前进。',
    '损': '损卦象征减损，适度取舍。有舍有得，合理分配。',
    '益': '益卦象征增益，锦上添花。利人利己，共同发展。',
    '夬': '夬卦象征决断，果断前行。当机立断，勇往直前。',
    '姤': '姤卦象征相遇，机缘巧合。珍惜缘分，把握机遇。',
    '萃': '萃卦象征聚集，人才汇聚。团结一心，共创大业。',
    '升': '升卦象征上升，步步高升。脚踏实地，稳步向前。',
    '困': '困卦象征困境，暂时受挫。坚守信念，终会突破。',
    '井': '井卦象征滋养，源源不断。修身养性，泽被后人。',
    '革': '革卦象征变革，除旧布新。顺应时势，改革创新。',
    '鼎': '鼎卦象征鼎新，革故鼎新。承前启后，继往开来。',
    '震': '震卦象征震动，惊醒振奋。居安思危，未雨绸缪。',
    '艮': '艮卦象征止住，适可而止。知止而后有定。',
    '渐': '渐卦象征渐进，循序渐进。按部就班，水到渠成。',
    '归妹': '归妹象征归宿，顺应自然。随缘而行，不必强求。',
    '丰': '丰卦象征丰盛，事业兴旺。保持清醒，居安思危。',
    '旅': '旅卦象征旅行，漂泊不定。灵活应变，见机行事。',
    '巽': '巽卦象征顺从，谦逊柔顺。以柔克刚，顺势而为。',
    '兑': '兑卦象征喜悦，和谐愉悦。真诚交流，其乐融融。',
    '涣': '涣卦象征涣散，人心离散。重新凝聚，团结一致。',
    '节': '节卦象征节制，适度为宜。有度有节，方能长久。',
    '中孚': '中孚象征诚信，真诚守信。以诚待人，必获信任。',
    '小过': '小过象征小过，谨小慎微。防微杜渐，避免过失。',
    '既济': '既济象征成功，大功告成。居安思危，保持谦逊。',
    '未济': '未济象征未成，仍需努力。继续前进，曙光在前。',
  }
  return insights[gua] || '卦象显示，顺应天时，把握机遇，保持正道，终会有所收获。'
}

onLoad((options) => {
  const historyId = String(options?.historyId || '')
  if (historyId) {
    const record = getMingliRecord(historyId)
    if (record?.type === 'liuyao') {
      build(record.data as { values: number[]; question: string }, false)
    }
    return
  }
  const valuesStr = String(options?.values || '')
  if (!valuesStr) return
  const values = valuesStr.split(',').map(Number).filter(n => [6, 7, 8, 9].includes(n))
  if (values.length !== 6) return
  const question = decodeURIComponent(String(options?.question || ''))
  build({ values, question }, true)
})

function build(input: { values: number[]; question: string }, shouldSave: boolean) {
  result.value = liuYaoPaiPan(input.question, input.values)
  if (shouldSave) {
    saveMingliRecord({
      type: 'liuyao',
      title: `${result.value.benGua.fullName}`,
      subtitle: input.question || '心中所问',
      data: { ...input }
    })
  }
}

function again() {
  uni.redirectTo({ url: APP_ROUTES.mingli.liuyao.shake })
}
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:var(--ming-paper);color:#172747}
.topbar { position: fixed; top: 30rpx; left: 0; right: 0; z-index: 40; padding: calc(var(--status-bar-height) + 14rpx) 24rpx 12rpx; display: flex; justify-content: flex-start; align-items: center; pointer-events: none; }
.capsule { pointer-events: auto; height: 64rpx; display: flex; align-items: center; border: 1rpx solid var(--ming-border-purple); border-radius: 32rpx; background: rgba(255,255,255,.08); overflow: hidden; box-shadow: inset 0 1rpx 0 rgba(255,255,255,.05); }
.capsule-left { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 58rpx; line-height: 1; }
.capsule-left text { transform: translateY(-2rpx); }
.capsule-mid { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); }
.capsule-mid .home-icon { font-size: 38rpx; line-height: 1; }
.capsule-divider { width: 1rpx; height: 36rpx; background: rgba(255,255,255,.16); }
.capsule-right { min-width: 70rpx; height: 64rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 24rpx; }
.capsule-right text { margin-left: 12rpx; }
.capsule-right text:first-child { margin-left: 0; }
.history-count { min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 50%; text-align: center; color: var(--ming-bg-deep); background: var(--ming-purple-glow); font-size: 20rpx; }
.hero{position:relative;min-height:580rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:22rpx}.eyebrow{color:var(--ming-text-purple-soft);font:18rpx Georgia,serif;letter-spacing:7rpx}.question{margin-top:12rpx;color:var(--ming-text-purple);font:700 32rpx STKaiti,serif;letter-spacing:3rpx;text-shadow:0 0 20rpx var(--ming-purple-soft)}.gua-ring{position:relative;width:240rpx;height:240rpx;margin-top:28rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx solid var(--ming-border-purple);border-radius:50%;box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint);animation:masterPulse 4s ease-in-out infinite}.gua-halo{position:absolute;border:1rpx solid var(--ming-purple-faint);border-radius:50%;animation:spin 20s linear infinite}.gua-halo-a{inset:-28rpx;border-style:dashed}.gua-halo-b{inset:22rpx;animation-direction:reverse;animation-duration:14s}.gua-name{color:var(--ming-text-purple);font:700 80rpx STKaiti,serif;line-height:1;text-shadow:0 0 32rpx var(--ming-purple-soft);animation:charGlow 3s ease-in-out infinite}.gua-full{color:var(--ming-text-purple-soft);font:22rpx STKaiti,serif;letter-spacing:3rpx}.ri-info{margin-top:20rpx;color:var(--ming-text-purple-soft);font-size:24rpx;letter-spacing:2rpx}
.paper-body{position:relative;margin-top:-18rpx;padding:46rpx 26rpx calc(50rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(101,72,30,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,var(--ming-paper)}
.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:#9f7730;text-align:center}.section-title view{display:flex;flex-direction:column}.title-main{color:#1b2d4d;font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub{margin-top:3rpx;color:#8b7b60;font-size:19rpx;letter-spacing:3rpx}
.yao-table{margin-top:28rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:20rpx 8rpx;overflow:hidden;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09)}.yao-header,.yao-row{display:flex;align-items:center;padding:18rpx 12rpx}.yao-header{background:rgba(158,117,42,.12);color:#7a6d56;font-size:22rpx;font-weight:600}.yao-row{border-top:1rpx solid rgba(158,117,42,.16)}.yao-row.dong{background:rgba(168,148,255,.08)}.yao-row.shi{background:rgba(196,168,248,.12)}.yao-row.ying{background:rgba(180,136,55,.08)}.col-shen{width:80rpx;font-size:20rpx;color:#7a6d56}.col-qin{width:80rpx;font-size:22rpx;color:#5e5644;font-weight:600}.col-gua{width:60rpx;font:700 26rpx STKaiti,serif;text-align:center}.col-yao{width:80rpx;display:flex;align-items:center;justify-content:center;gap:8rpx}.yao-line{width:60rpx;height:8rpx;border-radius:4rpx;background:linear-gradient(90deg,var(--ming-purple-strong),var(--ming-purple-soft))}.yao-line.broken{background:linear-gradient(90deg,var(--ming-purple-strong) 0 40%,transparent 40% 60%,var(--ming-purple-strong) 60%)}.dong-mark{color:#b48837;font-size:20rpx}.col-zhi{width:60rpx;text-align:center;font:700 26rpx STKaiti,serif}.col-bian{width:60rpx;display:flex;align-items:center;justify-content:center}
.gua-meaning{margin-top:28rpx;padding:28rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09)}.meaning-title{display:block;color:#9f7730;font:700 28rpx STKaiti,serif;letter-spacing:3rpx}.meaning-text{display:block;margin-top:12rpx;color:#4b3f2e;font-size:26rpx;line-height:1.8}
.bian-section{margin-top:24rpx;padding:20rpx 28rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:20rpx 8rpx;background:rgba(250,243,224,.5)}.bian-title{font:700 28rpx STKaiti,serif;color:#5e5644}
.insight-card{margin-top:30rpx;padding:30rpx;display:flex;gap:18rpx;border-top:1rpx solid rgba(154,112,40,.32);border-bottom:1rpx solid rgba(154,112,40,.32)}.insight-star{color:#a77a2d;font-size:42rpx}.insight-title,.insight-text{display:block}.insight-title{font:700 30rpx STKaiti,serif;color:#2a3a55}.insight-text{margin-top:8rpx;color:#6e6353;font-size:22rpx;line-height:1.65}
.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-purple);background:var(--ming-gradient-btn-soft);box-shadow:0 12rpx 26rpx var(--ming-purple-faint),inset 0 0 0 2rpx var(--ming-border-purple);font:700 29rpx STKaiti,serif;letter-spacing:4rpx}.again-btn::after{border:0}.again-btn:active{transform:translateY(2rpx)}
.disclaimer{display:block;margin-top:26rpx;text-align:center;color:#8a7b63;font-size:19rpx}
.empty{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30rpx;color:#786b54}.empty button{font-size:24rpx}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes charGlow{0%,100%{text-shadow:0 0 32rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes masterPulse{0%,100%{box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint)}50%{box-shadow:0 0 75rpx var(--ming-shadow-glow),inset 0 0 50rpx var(--ming-purple-soft)}}

.gua-xiang-card,.dongyao-card{margin-top:28rpx;padding:32rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}

/* 卦象图形 */
.gua-xiang-content{display:flex;flex-direction:column;align-items:center;gap:28rpx;margin-top:28rpx;padding:24rpx;border-radius:20rpx;background:rgba(255,250,235,.4)}.gua-xiang-part{display:flex;align-items:center;gap:28rpx}.gua-xiang-label{width:90rpx;font:700 30rpx STKaiti,serif;color:#1b2d4d;text-align:right;letter-spacing:2rpx}.gua-xiang-lines{display:flex;flex-direction:column;gap:18rpx}.gua-xiang-line{display:flex;align-items:center;gap:14rpx;padding:6rpx 0}.gua-xiang-line.dong{position:relative}.dong-icon{color:#b48837;font-size:26rpx;font-weight:700}.line-solid{width:140rpx;height:14rpx;border-radius:7rpx;background:linear-gradient(90deg,var(--ming-purple-strong),var(--ming-purple-soft));box-shadow:0 2rpx 6rpx rgba(111,83,247,.2)}.line-broken{display:flex;gap:24rpx}.line-broken view{width:58rpx;height:14rpx;border-radius:7rpx;background:linear-gradient(90deg,var(--ming-purple-strong),var(--ming-purple-soft));box-shadow:0 2rpx 6rpx rgba(111,83,247,.2)}.gua-xiang-divider{width:180rpx;height:2rpx;background:linear-gradient(90deg,transparent,rgba(158,117,42,.3),transparent)}

/* 动爻详解 */
.dongyao-list{display:flex;flex-direction:column;gap:20rpx;margin-top:24rpx}.dongyao-item{padding:24rpx;border-radius:18rpx;background:linear-gradient(135deg,rgba(255,250,235,.8),rgba(248,241,221,.6));border:1rpx solid rgba(158,117,42,.18);transition:all .3s}.dongyao-header{display:flex;align-items:center;gap:18rpx;padding-bottom:16rpx;border-bottom:1rpx solid rgba(158,117,42,.1)}.dongyao-pos{font:700 30rpx STKaiti,serif;color:#1b2d4d;letter-spacing:2rpx}.dongyao-liuqin{padding:6rpx 16rpx;border-radius:20rpx;font-size:22rpx;color:#9b7535;background:rgba(158,117,42,.08)}.dongyao-change{display:flex;align-items:center;gap:10rpx;margin-left:auto}.yao-line-sm{width:44rpx;height:8rpx;border-radius:4rpx;background:linear-gradient(90deg,var(--ming-purple-strong),var(--ming-purple-soft))}.yao-line-sm.broken{background:linear-gradient(90deg,var(--ming-purple-strong) 0 40%,transparent 40% 60%,var(--ming-purple-strong) 60%)}.change-arrow{color:#7a6d56;font-size:22rpx}.dongyao-meaning{display:block;margin-top:16rpx;color:#4b3f2e;font-size:25rpx;line-height:1.75}
</style>
