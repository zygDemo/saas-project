<!-- 注册页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>
          <ElForm
            class="mt-7.5"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
          >
            <ElFormItem prop="email">
              <div class="flex gap-3 w-full">
                <ElInput
                  class="custom-height flex-1"
                  v-model.trim="formData.email"
                  placeholder="请输入邮箱"
                />
                <ElButton
                  type="primary"
                  :disabled="countdown > 0"
                  @click="handleSendCode"
                  style="flex-shrink: 0; min-width: 120px"
                >
                  {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                </ElButton>
              </div>
            </ElFormItem>

            <ElFormItem prop="emailCode">
              <ElInput
                class="custom-height"
                v-model.trim="formData.emailCode"
                placeholder="请输入6位验证码"
                maxlength="6"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder.password')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder.confirmPassword')"
                type="password"
                autocomplete="off"
                @keyup.enter="register"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                {{ $t('register.agreeText') }}
                <RouterLink
                  style="color: var(--theme-color); text-decoration: none"
                  to="/privacy-policy"
                  >{{ $t('register.privacyPolicy') }}</RouterLink
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-g-600">
              <span>{{ $t('register.hasAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Login' }">{{
                $t('register.toLogin')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchRegister, sendEmailCode } from '@/api/auth'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'Register' })

  interface RegisterForm {
    password: string
    confirmPassword: string
    email: string
    emailCode: string
    agreement: boolean
  }

  const PASSWORD_MIN_LENGTH = 6
  const REDIRECT_DELAY = 1000

  const { t, locale } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()

  const loading = ref(false)
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const formData = reactive<RegisterForm>({
    password: '',
    confirmPassword: '',
    email: '',
    emailCode: '',
    agreement: false
  })

  const countdown = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const handleSendCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      ElMessage.warning('请输入正确的邮箱地址')
      return
    }
    if (countdown.value > 0) return
    try {
      await sendEmailCode({ email: formData.email, type: 'register' })
      ElMessage.success('验证码已发送')
      countdown.value = 60
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }, 1000)
    } catch (e) {
      // handled by interceptor
    }
  }

  /**
   * 验证密码
   * 当密码输入后，如果确认密码已填写，则触发确认密码的验证
   */
  const validatePassword = (
    _rule: Record<string, unknown>,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error(t('register.placeholder.password')))
      return
    }

    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }

    callback()
  }

  /**
   * 验证确认密码
   * 检查确认密码是否与密码一致
   */
  const validateConfirmPassword = (
    _rule: Record<string, unknown>,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error(t('register.rule.confirmPasswordRequired')))
      return
    }

    if (value !== formData.password) {
      callback(new Error(t('register.rule.passwordMismatch')))
      return
    }

    callback()
  }

  /**
   * 验证用户协议
   * 确保用户已勾选同意协议
   */
  const validateAgreement = (_rule: unknown, value: boolean, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule.agreementRequired')))
      return
    }
    callback()
  }

  const rules = computed<FormRules<RegisterForm>>(() => ({
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email' as const, message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    emailCode: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 6, message: '验证码为6位', trigger: 'blur' }
    ],
    password: [
      { required: true, validator: validatePassword, trigger: 'blur' },
      { min: PASSWORD_MIN_LENGTH, message: t('register.rule.passwordLength'), trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
    agreement: [{ validator: validateAgreement, trigger: 'change' }]
  }))

  /**
   * 注册用户
   * 验证表单后提交注册请求
   */
  const register = async () => {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    loading.value = true
    try {
      const res = await fetchRegister({
        userName: formData.email,
        password: formData.password,
        nickName: formData.email.split('@')[0],
        email: formData.email,
        emailCode: formData.emailCode
      })
      if (res.code === 200) {
        ElMessage.success('注册成功，即将跳转登录')
        setTimeout(() => router.push({ name: 'Login' }), 1500)
      } else {
        ElMessage.error(res.msg || '注册失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '注册失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }

  /**
   * 跳转到登录页面
   */
  const toLogin = () => {
    router.push({ name: 'Login' })
  }
</script>

<style scoped>
  @import '../login/style.css';
</style>
