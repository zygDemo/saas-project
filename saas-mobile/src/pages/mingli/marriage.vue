<template>
  <view class="page">
    <view class="hero">
      <mystic-sky />
      <view class="topbar">
        <view class="capsule cinema-glass">
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
      <view class="hero-copy">
        <text class="eyebrow">MARRIAGE COMPATIBILITY</text>
        <text class="hero-title">合婚</text>
        <text class="hero-subtitle">五行相合，天作之缘</text>
      </view>
      <view class="love-ring"><text>♥</text></view>
    </view>

    <view class="paper-body">
      <view class="section-title"><text>✦</text><view><text class="title-main">双方信息</text><text class="title-sub">请输入两人生辰八字</text></view><text>✦</text></view>

      <person-form v-model="male" title="男方" />
      <person-form v-model="female" title="女方" />

      <button class="submit-btn" hover-class="tap-active" :disabled="!canSubmit" aria-label="开始合婚分析" @tap="analyze">开始合婚</button>

      <!-- 结果展示 -->
      <view v-if="result" class="result-section" role="region" aria-label="合婚分析结果">
        <view class="score-card">
          <view class="score-ring">
            <text class="score-num">{{ result.score }}</text>
            <text class="score-label">分</text>
          </view>
          <text class="score-level">{{ result.level }}</text>
        </view>

        <view class="analysis-card">
          <text class="analysis-title">五行分析</text>
          <text class="analysis-text">{{ result.wuxingAnalysis }}</text>
        </view>

        <view class="analysis-card">
          <text class="analysis-title">性格匹配</text>
          <text class="analysis-text">{{ result.personalityMatch }}</text>
        </view>

        <view class="analysis-card">
          <text class="analysis-title">婚姻建议</text>
          <text class="analysis-text">{{ result.marriageAdvice }}</text>
        </view>

        <view class="detail-card">
          <text class="detail-title">详细信息</text>
          <view class="detail-row">
            <text class="detail-label">男方日主</text>
            <text class="detail-value">{{ result.maleRiZhu }} ({{ result.maleRiZhuWuXing }})</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">女方日主</text>
            <text class="detail-value">{{ result.femaleRiZhu }} ({{ result.femaleRiZhuWuXing }})</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">五行关系</text>
            <text class="detail-value">{{ result.wuxingRelation }}</text>
          </view>
        </view>

        <button class="again-btn" hover-class="tap-active" @tap="reset">重新合婚</button>
      </view>

      <text class="disclaimer">传统文化推演结果仅供参考，请理性看待</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { paiPan, WUXING_SHENG, WUXING_KE, type WuXing } from '@/common/mingli/bazi'
import { getMingliHistory } from '@/common/mingli/history'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'
import PersonForm, { type PersonFormData } from '@/components/mingli/person-form.vue'

interface PersonInfo extends PersonFormData {}

interface MarriageResult {
  score: number
  level: string
  wuxingAnalysis: string
  personalityMatch: string
  marriageAdvice: string
  maleRiZhu: string
  maleRiZhuWuXing: WuXing
  femaleRiZhu: string
  femaleRiZhuWuXing: WuXing
  wuxingRelation: string
}

const historyCount = ref(0)
const male = ref<PersonInfo>({ birthDate: '', birthHour: 12 })
const female = ref<PersonInfo>({ birthDate: '', birthHour: 12 })
const result = ref<MarriageResult | null>(null)

const canSubmit = computed(() => male.value.birthDate && female.value.birthDate)

onShow(() => {
  historyCount.value = getMingliHistory().length
})

function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}
function goHome() { uni.reLaunch({ url: APP_ROUTES.portal.home }) }
function goHistory() { uni.navigateTo({ url: APP_ROUTES.mingli.history }) }

function analyze() {
  const [mYear, mMonth, mDay] = male.value.birthDate.split('-').map(Number)
  const [fYear, fMonth, fDay] = female.value.birthDate.split('-').map(Number)

  const maleResult = paiPan(mYear, mMonth, mDay, male.value.birthHour, 'male')
  const femaleResult = paiPan(fYear, fMonth, fDay, female.value.birthHour, 'female')

  const maleWuXing = maleResult.riZhuWuXing
  const femaleWuXing = femaleResult.riZhuWuXing

  let wuxingRelation = ''
  let wuxingAnalysis = ''
  let score = 60

  if (maleWuXing === femaleWuXing) {
    wuxingRelation = '比和'
    wuxingAnalysis = '两人五行相同，性格相似，容易产生共鸣，但也可能缺乏互补。'
    score += 15
  } else if (WUXING_SHENG[maleWuXing] === femaleWuXing) {
    wuxingRelation = '相生（男女生）'
    wuxingAnalysis = `${maleWuXing}生${femaleWuXing}，男方对女方有滋养之恩，感情融洽。`
    score += 25
  } else if (WUXING_SHENG[femaleWuXing] === maleWuXing) {
    wuxingRelation = '相生（女生男）'
    wuxingAnalysis = `${femaleWuXing}生${maleWuXing}，女方对男方有扶持之意，家庭和睦。`
    score += 20
  } else if (WUXING_KE[maleWuXing] === femaleWuXing) {
    wuxingRelation = '相克（男克女）'
    wuxingAnalysis = `${maleWuXing}克${femaleWuXing}，男方对女方有克制，需注意沟通方式。`
    score -= 10
  } else if (WUXING_KE[femaleWuXing] === maleWuXing) {
    wuxingRelation = '相克（女克男）'
    wuxingAnalysis = `${femaleWuXing}克${maleWuXing}，女方对男方有制约，需相互包容。`
    score -= 5
  }

  const personalityMatch = getPersonalityMatch(maleWuXing, femaleWuXing)
  const marriageAdvice = getMarriageAdvice(maleWuXing, femaleWuXing, score)

  const maleWuXingCount = maleResult.wuXingCount
  const femaleWuXingCount = femaleResult.wuXingCount

  const complementary = Object.keys(maleWuXingCount).filter(wx => 
    maleWuXingCount[wx as WuXing] === 0 && femaleWuXingCount[wx as WuXing] > 0
  )
  if (complementary.length > 0) score += 5

  score = Math.max(40, Math.min(100, score))

  let level = ''
  if (score >= 90) level = '天作之合'
  else if (score >= 80) level = '情投意合'
  else if (score >= 70) level = '相敬如宾'
  else if (score >= 60) level = '平淡是真'
  else level = '需多包容'

  result.value = {
    score,
    level,
    wuxingAnalysis,
    personalityMatch,
    marriageAdvice,
    maleRiZhu: maleResult.riZhu,
    maleRiZhuWuXing: maleWuXing,
    femaleRiZhu: femaleResult.riZhu,
    femaleRiZhuWuXing: femaleWuXing,
    wuxingRelation,
  }
}

function getPersonalityMatch(male: WuXing, female: WuXing): string {
  const matches: Record<string, string> = {
    '金金': '两人性格刚毅果断，有共同语言，但需注意固执己见。',
    '金木': '金主义，木主仁，刚柔相济，互补性强。',
    '金水': '金生水，男方对女方有滋养，感情稳定。',
    '金火': '火克金，性格冲突较多，需相互磨合。',
    '金土': '土生金，女方对男方有扶持，家庭和睦。',
    '木木': '两人性格温和善良，但可能缺乏决断力。',
    '木火': '木生火，男方对女方有助力，事业顺利。',
    '木土': '木克土，性格差异较大，需相互理解。',
    '木水': '水生木，女方对男方有滋养，感情深厚。',
    '木金': '金克木，女方对男方有制约，需包容。',
    '水水': '两人聪明灵活，但可能缺乏稳定性。',
    '水火': '水火不容，性格冲突较大，需努力调和。',
    '水土': '土克水，男方对女方有约束，需沟通。',
    '水木': '水生木，男方对女方有助力，感情融洽。',
    '水金': '金生水，女方对男方有滋养，关系和谐。',
    '火火': '两人热情开朗，但可能冲动易怒。',
    '火土': '火生土，男方对女方有扶持，家庭稳定。',
    '火金': '火克金，男方对女方有制约，需相互尊重。',
    '火水': '水克火，女方对男方有约束，需包容。',
    '火木': '木生火，女方对男方有助力，事业有成。',
    '土土': '两人稳重踏实，但可能缺乏激情。',
    '土金': '土生金，男方对女方有滋养，财运亨通。',
    '土水': '土克水，男方对女方有约束，需沟通。',
    '土火': '火生土，女方对男方有扶持，感情稳定。',
    '土木': '木克土，女方对男方有制约，需相互理解。',
  }
  return matches[`${male}${female}`] || '五行相配，各有特点。'
}

function getMarriageAdvice(male: WuXing, female: WuXing, score: number): string {
  if (score >= 80) {
    return '两人五行相合，感情基础良好。建议珍惜缘分，相互扶持，共同成长。'
  } else if (score >= 60) {
    return '两人五行有相生相克，感情需要经营。建议多沟通理解，包容对方缺点。'
  } else {
    return '两人五行相克较多，感情需要更多努力。建议相互尊重，寻找共同兴趣。'
  }
}

function reset() {
  male.value = { birthDate: '', birthHour: 12 }
  female.value = { birthDate: '', birthHour: 12 }
  result.value = null
}
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:var(--ming-bg-deep);color:var(--ming-text-primary)}
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
.history-count { min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 50%; text-align: center; color: var(--ming-bg-deep); background: var(--ming-cyan); font-size: 20rpx; box-shadow: 0 0 10rpx var(--ming-cyan-soft); }
.hero{position:relative;height:540rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:calc(var(--status-bar-height) + 110rpx)}.eyebrow{color:var(--ming-text-purple-soft);font:18rpx Georgia,serif;letter-spacing:7rpx;text-shadow:0 0 10rpx rgba(79,195,247,.3)}.hero-title{margin-top:22rpx;color:var(--ming-text-purple);font:700 64rpx STKaiti,KaiTi,serif;letter-spacing:12rpx;text-shadow:0 0 30rpx var(--ming-purple-soft);animation:titleGlow 4s ease-in-out infinite}.hero-subtitle{margin-top:14rpx;color:var(--ming-text-primary);font:28rpx STKaiti,KaiTi,serif;letter-spacing:3rpx;text-shadow:0 0 8rpx rgba(79,195,247,.22)}
.love-ring{position:absolute;z-index:3;left:50%;bottom:-60rpx;width:200rpx;height:200rpx;margin-left:-100rpx;display:flex;align-items:center;justify-content:center;border:2rpx solid var(--ming-border-purple);border-radius:50%;color:var(--ming-text-purple);font:700 80rpx STKaiti,serif;box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);animation:archiveBreathe 4s ease-in-out infinite}
.paper-body{position:relative;margin-top:-18rpx;min-height:500rpx;padding:40rpx 25rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:radial-gradient(circle at 50% 0,rgba(22,36,73,.55) 0,transparent 60%),var(--ming-bg-deep)}
.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:var(--ming-cyan);text-align:center}.section-title view{display:flex;flex-direction:column}.title-main{color:var(--ming-text-primary);font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub{margin-top:3rpx;color:var(--ming-text-primary);font-size:19rpx;letter-spacing:3rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
:deep(.person-card:first-of-type) { margin-top: 8rpx; }
.submit-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-primary);background:var(--ming-gradient-btn);box-shadow:0 12rpx 26rpx rgba(41,182,246,.22),inset 0 0 0 1rpx rgba(255,255,255,.1);font:700 29rpx STKaiti,serif;letter-spacing:4rpx;display:flex;align-items:center;justify-content:center;line-height:1}.submit-btn::after{display:none;border:0}.submit-btn:active{transform:translateY(2rpx)}.submit-btn[disabled]{opacity:.45}
.result-section{margin-top:40rpx}
.score-card{display:flex;flex-direction:column;align-items:center;padding:40rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:24rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.score-ring{width:200rpx;height:200rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3rpx solid var(--ming-border-purple);border-radius:50%;box-shadow:0 0 40rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint)}.score-num{font:700 80rpx STKaiti,serif;color:var(--ming-text-primary);line-height:1}.score-label{color:var(--ming-text-primary);font-size:24rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.score-level{margin-top:20rpx;font:700 36rpx STKaiti,serif;color:var(--ming-cyan);letter-spacing:4rpx}
.analysis-card{margin-top:24rpx;padding:28rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:24rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.analysis-title{display:block;margin-bottom:16rpx;padding-bottom:12rpx;border-bottom:1rpx solid rgba(79,195,247,.14);font:700 28rpx STKaiti,serif;color:var(--ming-text-primary);letter-spacing:3rpx}.analysis-text{display:block;color:var(--ming-text-primary);font-size:25rpx;line-height:1.8;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.detail-card{margin-top:24rpx;padding:28rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:24rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.detail-title{display:block;margin-bottom:20rpx;padding-bottom:12rpx;border-bottom:1rpx solid rgba(79,195,247,.14);font:700 28rpx STKaiti,serif;color:var(--ming-text-primary);letter-spacing:3rpx}.detail-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16rpx;padding:12rpx 16rpx;border-radius:12rpx;background:rgba(79,195,247,.08)}.detail-label{color:var(--ming-text-primary);font-size:24rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.detail-value{color:var(--ming-text-primary);font:700 24rpx STKaiti,serif}
.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-primary);background:var(--ming-gradient-btn);box-shadow:0 12rpx 26rpx rgba(41,182,246,.22),inset 0 0 0 1rpx rgba(255,255,255,.1);font:700 29rpx STKaiti,serif;letter-spacing:4rpx;display:flex;align-items:center;justify-content:center;line-height:1}.again-btn::after{display:none;border:0}.again-btn:active{transform:translateY(2rpx)}
.disclaimer{display:block;margin-top:26rpx;text-align:center;color:var(--ming-text-purple-soft);font-size:19rpx}
@keyframes titleGlow{0%,100%{text-shadow:0 0 30rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes archiveBreathe{0%,100%{box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);transform:scale(1)}50%{box-shadow:0 0 90rpx var(--ming-shadow-glow),inset 0 0 40rpx var(--ming-purple-soft);transform:scale(1.03)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }
</style>
