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
      <view class="hero-copy">
        <text class="eyebrow">MARRIAGE COMPATIBILITY</text>
        <text class="hero-title">合婚</text>
        <text class="hero-subtitle">五行相合，天作之缘</text>
      </view>
      <view class="love-ring"><text>♥</text></view>
    </view>

    
    <view class="theme-panel">
      <view class="theme-panel__head">
        <text class="theme-panel__title">主题切换</text>
        <text class="theme-panel__current">{{ themeLabel }}</text>
      </view>
      <view class="theme-seg">
        <view v-for="item in themeOptions" :key="item.value" class="theme-seg__item" :class="{ active: themeMode === item.value }" hover-class="tap-active" @tap="setTheme(item.value as MingliThemeMode)">
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>
    <view class="paper-body">
      <view class="section-title"><text>✦</text><view><text class="title-main">双方信息</text><text class="title-sub">请输入两人生辰八字</text></view><text>✦</text></view>

      <!-- 男方信息 -->
      <view class="person-card">
        <text class="person-label">男方</text>
        <view class="form-row">
          <text class="form-label">出生日期</text>
          <picker mode="date" :value="male.birthDate" @change="onMaleDateChange">
            <view class="form-picker">{{ male.birthDate || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">出生时辰</text>
          <picker :range="hourOptions" :range-key="'label'" :value="male.hourIndex" @change="onMaleHourChange">
            <view class="form-picker">{{ hourOptions[male.hourIndex].label }}</view>
          </picker>
        </view>
      </view>

      <!-- 女方信息 -->
      <view class="person-card">
        <text class="person-label">女方</text>
        <view class="form-row">
          <text class="form-label">出生日期</text>
          <picker mode="date" :value="female.birthDate" @change="onFemaleDateChange">
            <view class="form-picker">{{ female.birthDate || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">出生时辰</text>
          <picker :range="hourOptions" :range-key="'label'" :value="female.hourIndex" @change="onFemaleHourChange">
            <view class="form-picker">{{ hourOptions[female.hourIndex].label }}</view>
          </picker>
        </view>
      </view>

      <button class="submit-btn" hover-class="tap-active" :disabled="!canSubmit" @tap="analyze">开始合婚</button>

      <!-- 结果展示 -->
      <view v-if="result" class="result-section">
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
import { useMingliTheme, type MingliThemeMode } from './theme'

interface PersonInfo {
  birthDate: string
  hourIndex: number
}

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

const { themeClass, themeMode, themeLabel, themeOptions, setTheme } = useMingliTheme()
const historyCount = ref(0)
const male = ref<PersonInfo>({ birthDate: '', hourIndex: 6 })
const female = ref<PersonInfo>({ birthDate: '', hourIndex: 6 })
const result = ref<MarriageResult | null>(null)

const hourOptions = [
  { label: '子时 (23:00-01:00)', value: 0 },
  { label: '丑时 (01:00-03:00)', value: 1 },
  { label: '寅时 (03:00-05:00)', value: 2 },
  { label: '卯时 (05:00-07:00)', value: 3 },
  { label: '辰时 (07:00-09:00)', value: 4 },
  { label: '巳时 (09:00-11:00)', value: 5 },
  { label: '午时 (11:00-13:00)', value: 6 },
  { label: '未时 (13:00-15:00)', value: 7 },
  { label: '申时 (15:00-17:00)', value: 8 },
  { label: '酉时 (17:00-19:00)', value: 9 },
  { label: '戌时 (19:00-21:00)', value: 10 },
  { label: '亥时 (21:00-23:00)', value: 11 },
]

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

function onMaleDateChange(e: { detail: { value: string } }) { male.value.birthDate = e.detail.value }
function onMaleHourChange(e: { detail: { value: number } }) { male.value.hourIndex = Number(e.detail.value) }
function onFemaleDateChange(e: { detail: { value: string } }) { female.value.birthDate = e.detail.value }
function onFemaleHourChange(e: { detail: { value: number } }) { female.value.hourIndex = Number(e.detail.value) }

function analyze() {
  const [mYear, mMonth, mDay] = male.value.birthDate.split('-').map(Number)
  const [fYear, fMonth, fDay] = female.value.birthDate.split('-').map(Number)

  const maleResult = paiPan(mYear, mMonth, mDay, hourOptions[male.value.hourIndex].value, 'male')
  const femaleResult = paiPan(fYear, fMonth, fDay, hourOptions[female.value.hourIndex].value, 'female')

  const maleWuXing = maleResult.riZhuWuXing
  const femaleWuXing = femaleResult.riZhuWuXing

  // 计算五行关系
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

  // 性格匹配分析
  const personalityMatch = getPersonalityMatch(maleWuXing, femaleWuXing)

  // 婚姻建议
  const marriageAdvice = getMarriageAdvice(maleWuXing, femaleWuXing, score)

  // 根据八字其他因素微调分数
  const maleWuXingCount = maleResult.wuXingCount
  const femaleWuXingCount = femaleResult.wuXingCount

  // 检查是否有互补的五行
  const complementary = Object.keys(maleWuXingCount).filter(wx => 
    maleWuXingCount[wx as WuXing] === 0 && femaleWuXingCount[wx as WuXing] > 0
  )
  if (complementary.length > 0) score += 5

  // 确保分数在合理范围内
  score = Math.max(40, Math.min(100, score))

  // 确定等级
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
  male.value = { birthDate: '', hourIndex: 6 }
  female.value = { birthDate: '', hourIndex: 6 }
  result.value = null
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
.hero{position:relative;height:480rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:40rpx}.eyebrow{color:var(--ming-text-purple-soft);font:18rpx Georgia,serif;letter-spacing:7rpx}.hero-title{margin-top:22rpx;color:var(--ming-text-purple);font:700 64rpx STKaiti,KaiTi,serif;letter-spacing:12rpx;text-shadow:0 0 30rpx var(--ming-purple-soft);animation:titleGlow 4s ease-in-out infinite}.hero-subtitle{margin-top:14rpx;color:var(--ming-text-purple);font:28rpx STKaiti,KaiTi,serif;letter-spacing:3rpx}
.love-ring{position:absolute;z-index:3;left:50%;bottom:-60rpx;width:200rpx;height:200rpx;margin-left:-100rpx;display:flex;align-items:center;justify-content:center;border:2rpx solid var(--ming-border-purple);border-radius:50%;color:var(--ming-text-purple);font:700 80rpx STKaiti,serif;box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);animation:archiveBreathe 4s ease-in-out infinite}
.paper-body{position:relative;margin-top:-18rpx;min-height:500rpx;padding:40rpx 25rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(96,69,29,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,var(--ming-paper)}
.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:#9f7730;text-align:center}.section-title view{display:flex;flex-direction:column}.title-main{color:#1b2d4d;font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub{margin-top:3rpx;color:#8b7b60;font-size:19rpx;letter-spacing:3rpx}
.person-card{margin-top:28rpx;padding:32rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}.person-label{display:block;margin-bottom:24rpx;padding-bottom:16rpx;border-bottom:1rpx solid rgba(158,117,42,.12);font:700 34rpx STKaiti,serif;color:#1b2d4d;letter-spacing:4rpx}.form-row{display:flex;align-items:center;margin-bottom:20rpx}.form-label{width:160rpx;color:#6b604a;font-size:25rpx;font-weight:600}.form-picker{flex:1;padding:18rpx 24rpx;border:1rpx solid rgba(158,117,42,.25);border-radius:14rpx;background:rgba(255,250,235,.6);color:#4b3f2e;font-size:25rpx;transition:all .3s}.form-picker:active{border-color:rgba(158,117,42,.4);background:rgba(255,250,235,.8)}
.submit-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-purple);background:var(--ming-gradient-btn-soft);box-shadow:0 12rpx 26rpx var(--ming-purple-faint),inset 0 0 0 2rpx var(--ming-border-purple);font:700 29rpx STKaiti,serif;letter-spacing:4rpx;display:flex;align-items:center;justify-content:center;line-height:1}.submit-btn::after{display:none;border:0}.submit-btn:active{transform:translateY(2rpx)}.submit-btn[disabled]{opacity:.5}
.result-section{margin-top:40rpx}
.score-card{display:flex;flex-direction:column;align-items:center;padding:40rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}.score-ring{width:200rpx;height:200rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3rpx solid var(--ming-border-purple);border-radius:50%;box-shadow:0 0 40rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint)}.score-num{font:700 80rpx STKaiti,serif;color:var(--ming-text-purple);line-height:1}.score-label{color:var(--ming-text-purple-soft);font-size:24rpx}.score-level{margin-top:20rpx;font:700 36rpx STKaiti,serif;color:#1b2d4d;letter-spacing:4rpx}
.analysis-card{margin-top:24rpx;padding:28rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}.analysis-title{display:block;margin-bottom:16rpx;padding-bottom:12rpx;border-bottom:1rpx solid rgba(158,117,42,.12);font:700 28rpx STKaiti,serif;color:#1b2d4d;letter-spacing:3rpx}.analysis-text{display:block;color:#4b3f2e;font-size:25rpx;line-height:1.8}
.detail-card{margin-top:24rpx;padding:28rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}.detail-title{display:block;margin-bottom:20rpx;padding-bottom:12rpx;border-bottom:1rpx solid rgba(158,117,42,.12);font:700 28rpx STKaiti,serif;color:#1b2d4d;letter-spacing:3rpx}.detail-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16rpx;padding:12rpx 16rpx;border-radius:12rpx;background:rgba(255,250,235,.4)}.detail-label{color:#6b604a;font-size:24rpx}.detail-value{color:#4b3f2e;font:700 24rpx STKaiti,serif}
.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-purple);background:var(--ming-gradient-btn-soft);box-shadow:0 12rpx 26rpx var(--ming-purple-faint),inset 0 0 0 2rpx var(--ming-border-purple);font:700 29rpx STKaiti,serif;letter-spacing:4rpx;display:flex;align-items:center;justify-content:center;line-height:1}.again-btn::after{display:none;border:0}.again-btn:active{transform:translateY(2rpx)}
.disclaimer{display:block;margin-top:26rpx;text-align:center;color:#8a7b63;font-size:19rpx}
@keyframes titleGlow{0%,100%{text-shadow:0 0 30rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes archiveBreathe{0%,100%{box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);transform:scale(1)}50%{box-shadow:0 0 90rpx var(--ming-shadow-glow),inset 0 0 40rpx var(--ming-purple-soft);transform:scale(1.03)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }

.theme-panel{margin:18rpx 24rpx 18rpx;padding:22rpx 22rpx 20rpx;border-radius:28rpx;border:1rpx solid rgba(143,99,247,.16);background:linear-gradient(180deg,rgba(18,19,48,.92),rgba(30,24,63,.88));box-shadow:0 14rpx 30rpx rgba(25,19,65,.14),inset 0 0 0 1rpx rgba(255,255,255,.03)}
.theme-panel__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14rpx}
.theme-panel__title{font:700 28rpx STKaiti,serif;letter-spacing:4rpx;color:var(--ming-text-purple)}
.theme-panel__current{color:rgba(247,244,255,.68);font-size:21rpx}
.theme-seg{display:flex;gap:10rpx}
.theme-seg__item{flex:1;height:70rpx;display:flex;align-items:center;justify-content:center;border-radius:18rpx;color:rgba(247,244,255,.74);background:rgba(255,255,255,.04);border:1rpx solid rgba(227,220,255,.08);font-size:22rpx}
.theme-seg__item.active{color:#fff;background:linear-gradient(135deg,rgba(168,148,255,.18),rgba(111,83,247,.84));border-color:rgba(178,159,255,.20);box-shadow:0 8rpx 20rpx rgba(111,83,247,.14)}
</style>
