<!--
  异常IP监控子页面

  检测规则说明：
  1. 突发攻击检测：5分钟内异常请求（statusCode >= 400）超过50次的IP
  2. 登录接口监控：登录接口（auth/login模块）请求超过5次且失败率高的IP
  3. 连续失败检测：连续失败（statusCode >= 400）超过5次的IP
  4. 综合攻击排行：异常请求总次数超过10次的IP

  威胁等级说明：
  - 严重：突发请求≥100 / 登录失败≥10 / 连续失败≥20 → 立即封禁IP
  - 高危：突发请求≥70 / 登录失败≥5 / 连续失败≥10 → 限制访问频率
  - 中危：其他异常请求 → 持续观察，记录日志

  注意：所有检测只统计异常请求（statusCode >= 400），不包含正常请求
-->
<template>
  <div class="attack-monitor-page">
    <!-- 统计卡片 -->
    <ElRow :gutter="20" class="mb-5">
      <ElCol :span="6">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-warning/10 text-warning">
              <ArtSvgIcon icon="ri:warning-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-danger">{{ stats.attackIps?.length || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">异常IP数</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :span="6">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-warning/10 text-warning">
              <ArtSvgIcon icon="ri:lightning-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-warning">{{ stats.burstIps?.length || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">突发攻击</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :span="6">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-info/10 text-info">
              <ArtSvgIcon icon="ri:lock-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-info">{{ stats.loginAttempts?.length || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">登录异常</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :span="6">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-danger/10 text-danger">
              <ArtSvgIcon icon="ri:error-warning-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-danger">{{ stats.consecutiveFails?.length || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">连续失败</p>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 检测规则说明 -->
    <ElAlert
      title="异常IP检测规则说明"
      type="info"
      :closable="false"
      show-icon
      class="mb-5"
    >
      <template #default>
        <div class="rules-content">
          <div class="rule-item">
            <ElTag type="warning" size="small" effect="dark">突发攻击</ElTag>
            <span>5分钟内异常请求（statusCode >= 400）超过 <strong>50次</strong> 的IP，可能是DDoS攻击或爬虫</span>
          </div>
          <div class="rule-item">
            <ElTag type="info" size="small" effect="dark">登录异常</ElTag>
            <span>登录接口请求超过 <strong>5次</strong> 且失败率高的IP，可能是暴力破解</span>
          </div>
          <div class="rule-item">
            <ElTag type="danger" size="small" effect="dark">连续失败</ElTag>
            <span>连续失败（statusCode >= 400）超过 <strong>5次</strong> 的IP，可能是恶意扫描或攻击</span>
          </div>
          <div class="rule-item">
            <ElTag type="danger" size="small" effect="dark">综合排行</ElTag>
            <span>异常请求总次数超过 <strong>10次</strong> 的IP，按请求量降序排列</span>
          </div>
        </div>
      </template>
    </ElAlert>

    <!-- 威胁等级说明 -->
    <ElAlert
      title="威胁等级说明"
      type="warning"
      :closable="false"
      show-icon
      class="mb-5"
    >
      <template #default>
        <div class="threat-levels">
          <div class="level-item">
            <ElTag type="danger" effect="dark" size="small">严重</ElTag>
            <span>突发请求≥100 / 登录失败≥10 / 连续失败≥20</span>
            <span class="action">→ 立即封禁IP，检查系统漏洞</span>
          </div>
          <div class="level-item">
            <ElTag type="danger" effect="dark" size="small">高危</ElTag>
            <span>突发请求≥70 / 登录失败≥5 / 连续失败≥10</span>
            <span class="action">→ 限制访问频率，加强监控</span>
          </div>
          <div class="level-item">
            <ElTag type="warning" effect="dark" size="small">中危</ElTag>
            <span>其他异常请求</span>
            <span class="action">→ 持续观察，记录日志</span>
          </div>
        </div>
      </template>
    </ElAlert>

    <!-- 检测结果Tab -->
    <ElCard class="mb-5">
      <ElTabs v-model="activeTab">
        <!-- 1. 突发攻击检测 -->
        <ElTabPane name="burst">
          <template #label>
            <ElBadge :value="stats.burstIps?.length || 0" :hidden="!stats.burstIps?.length" class="tab-badge">
              <span>突发攻击检测</span>
            </ElBadge>
          </template>
          <div class="tab-content">
            <div class="tab-header">
              <h4>5分钟内异常请求超过50次的IP</h4>
              <ElTag type="warning" size="small">检测窗口: 5分钟</ElTag>
            </div>
            <ElTable :data="stats.burstIps" stripe border size="small">
              <ElTableColumn type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <ElTag :type="$index < 3 ? 'danger' : 'info'" effect="dark" size="small">{{ $index + 1 }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="ip" label="IP地址" width="160">
                <template #default="{ row }">
                  <ElTag type="danger" effect="dark" size="small">{{ row.ip }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="burstCount" label="突发请求次数" width="120" align="center">
                <template #default="{ row }">
                  <span class="font-bold text-danger">{{ row.burstCount }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="windowStart" label="开始时间" width="180">
                <template #default="{ row }">
                  <span class="text-sm">{{ formatDateTime(row.windowStart) }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="windowEnd" label="结束时间" width="180">
                <template #default="{ row }">
                  <span class="text-sm">{{ formatDateTime(row.windowEnd) }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="威胁等级" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="getThreatType(row.threatLevel)" effect="dark" size="small">
                    {{ getThreatLabel(row.threatLevel) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="建议操作" min-width="200">
                <template #default="{ row }">
                  <span class="text-sm text-g-500">{{ getThreatAction(row.threatLevel) }}</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElTabPane>

        <!-- 2. 登录接口监控 -->
        <ElTabPane name="login">
          <template #label>
            <ElBadge :value="stats.loginAttempts?.length || 0" :hidden="!stats.loginAttempts?.length" class="tab-badge">
              <span>登录接口监控</span>
            </ElBadge>
          </template>
          <div class="tab-content">
            <div class="tab-header">
              <h4>登录接口异常请求（暴力破解检测）</h4>
              <ElTag type="info" size="small">监控模块: auth/login</ElTag>
            </div>
            <ElTable :data="stats.loginAttempts" stripe border size="small">
              <ElTableColumn type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <ElTag :type="$index < 3 ? 'danger' : 'info'" effect="dark" size="small">{{ $index + 1 }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="ip" label="IP地址" width="160">
                <template #default="{ row }">
                  <ElTag type="danger" effect="dark" size="small">{{ row.ip }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="count" label="总请求" width="100" align="center">
                <template #default="{ row }">
                  <span class="font-bold">{{ row.count }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="failCount" label="失败次数" width="100" align="center">
                <template #default="{ row }">
                  <span class="font-bold text-danger">{{ row.failCount }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="failRate" label="失败率" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="row.failRate > 80 ? 'danger' : row.failRate > 50 ? 'warning' : 'success'" size="small">
                    {{ row.failRate }}%
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="lastAttempt" label="最后尝试" width="180">
                <template #default="{ row }">
                  <span class="text-sm">{{ formatDateTime(row.lastAttempt) }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="威胁等级" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="getThreatType(row.threatLevel)" effect="dark" size="small">
                    {{ getThreatLabel(row.threatLevel) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="建议操作" min-width="200">
                <template #default="{ row }">
                  <span class="text-sm text-g-500">{{ getThreatAction(row.threatLevel) }}</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElTabPane>

        <!-- 3. 连续失败检测 -->
        <ElTabPane name="consecutive">
          <template #label>
            <ElBadge :value="stats.consecutiveFails?.length || 0" :hidden="!stats.consecutiveFails?.length" class="tab-badge">
              <span>连续失败检测</span>
            </ElBadge>
          </template>
          <div class="tab-content">
            <div class="tab-header">
              <h4>连续失败（statusCode >= 400）超过5次的IP</h4>
              <ElTag type="danger" size="small">阈值: 5次</ElTag>
            </div>
            <ElTable :data="stats.consecutiveFails" stripe border size="small">
              <ElTableColumn type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <ElTag :type="$index < 3 ? 'danger' : 'info'" effect="dark" size="small">{{ $index + 1 }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="ip" label="IP地址" width="160">
                <template #default="{ row }">
                  <ElTag type="danger" effect="dark" size="small">{{ row.ip }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="consecutiveFails" label="连续失败次数" width="120" align="center">
                <template #default="{ row }">
                  <span class="font-bold text-danger">{{ row.consecutiveFails }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="failModule" label="失败模块" width="120">
                <template #default="{ row }">
                  <ElTag type="info" size="small">{{ row.failModule || '-' }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="lastFailTime" label="最后失败时间" width="180">
                <template #default="{ row }">
                  <span class="text-sm">{{ formatDateTime(row.lastFailTime) }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="威胁等级" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="getThreatType(row.threatLevel)" effect="dark" size="small">
                    {{ getThreatLabel(row.threatLevel) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="建议操作" min-width="200">
                <template #default="{ row }">
                  <span class="text-sm text-g-500">{{ getThreatAction(row.threatLevel) }}</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElTabPane>

        <!-- 4. 综合攻击排行 -->
        <ElTabPane name="rank">
          <template #label>
            <ElBadge :value="stats.attackIps?.length || 0" :hidden="!stats.attackIps?.length" class="tab-badge">
              <span>综合攻击排行</span>
            </ElBadge>
          </template>
          <div class="tab-content">
            <div class="tab-header">
              <h4>异常IP攻击排行（statusCode >= 400，请求次数 >= 10）</h4>
              <ElTag type="danger" size="small">TOP 10</ElTag>
            </div>
            <ElTable :data="stats.attackIps" stripe border size="small">
              <ElTableColumn type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <ElTag :type="$index < 3 ? 'danger' : 'info'" effect="dark" size="small">{{ $index + 1 }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="ip" label="IP地址" width="160">
                <template #default="{ row }">
                  <ElTag type="danger" effect="dark" size="small">{{ row.ip }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="count" label="总请求" width="100" align="center">
                <template #default="{ row }">
                  <span class="font-bold">{{ row.count }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="failCount" label="失败次数" width="100" align="center">
                <template #default="{ row }">
                  <span class="font-bold text-danger">{{ row.failCount }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="failRate" label="失败率" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="row.failRate > 50 ? 'danger' : row.failRate > 20 ? 'warning' : 'success'" size="small">
                    {{ row.failRate }}%
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="威胁等级" width="100" align="center">
                <template #default="{ row }">
                  <ElTag :type="getAttackThreatType(row)" effect="dark" size="small">
                    {{ getAttackThreatLabel(row) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="建议操作" min-width="200">
                <template #default="{ row }">
                  <span class="text-sm text-g-500">{{ getAttackThreatAction(row) }}</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { AuditLogStats } from '@/api/data-center'

  const props = defineProps<{
    stats: AuditLogStats
  }>()

  const activeTab = ref('burst')

  // 格式化日期时间
  const formatDateTime = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
  }

  // 威胁等级转换
  const getThreatType = (level: string) => {
    const map: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
      critical: 'danger', high: 'danger', medium: 'warning', low: 'info'
    }
    return map[level] || 'info'
  }

  const getThreatLabel = (level: string) => {
    const map: Record<string, string> = {
      critical: '严重', high: '高危', medium: '中危', low: '低危'
    }
    return map[level] || '未知'
  }

  const getThreatAction = (level: string) => {
    const map: Record<string, string> = {
      critical: '立即封禁IP，检查系统漏洞，通知安全团队',
      high: '限制访问频率，加强监控，记录攻击特征',
      medium: '持续观察，记录日志，分析访问模式',
      low: '记录日志，定期复查'
    }
    return map[level] || '持续观察'
  }

  // 综合攻击排行的威胁等级
  const getAttackThreatType = (row: { failRate: number; count: number }) => {
    if (row.failRate > 80 || row.count > 100) return 'danger'
    if (row.failRate > 50 || row.count > 50) return 'warning'
    return 'info'
  }

  const getAttackThreatLabel = (row: { failRate: number; count: number }) => {
    if (row.failRate > 80 || row.count > 100) return '高危'
    if (row.failRate > 50 || row.count > 50) return '中危'
    return '低危'
  }

  const getAttackThreatAction = (row: { failRate: number; count: number }) => {
    if (row.failRate > 80 || row.count > 100) return '建议立即封禁IP，检查系统漏洞'
    if (row.failRate > 50 || row.count > 50) return '建议限制访问频率，加强监控'
    return '持续观察，记录日志'
  }
</script>

<style scoped>
  .attack-monitor-page {
    padding: 0;
  }

  .tab-badge {
    :deep(.el-badge__content) {
      top: -2px;
    }
  }

  .tab-content {
    min-height: 300px;
  }

  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  .rules-content {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .rule-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);

      strong {
        color: var(--el-color-danger);
        font-weight: 600;
      }
    }
  }

  .threat-levels {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .level-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);

      .action {
        color: var(--el-color-warning);
        font-weight: 500;
        margin-left: 8px;
      }
    }
  }

  .font-bold { font-weight: 600; }
</style>
