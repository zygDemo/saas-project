<template>
  <div class="page-content !border-0 !bg-transparent min-h-screen flex-cc">
    <div class="flex-cc max-md:!block max-md:text-center">
      <ThemeSvg :src="data.imgUrl" size="100%" class="!w-100" />
      <div class="ml-15 w-75 max-md:mx-auto max-md:mt-10 max-md:w-full max-md:text-center">
        <p class="text-xl leading-7 text-g-600 max-md:text-lg">{{ data.desc }}</p>
        <div class="mt-5 flex gap-3 max-md:justify-center">
          <ElButton type="primary" size="large" @click="backHome" v-ripple>
            {{ data.btnText }}
          </ElButton>
          <ElButton size="large" @click="clearCacheAndReload" v-ripple>
            <ArtSvgIcon icon="ri:delete-bin-line" class="mr-1" />
            清除缓存并重新登录
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useCommon } from '@/hooks/core/useCommon'
  import { useUserStore } from '@/store/modules/user'
  import { ElMessageBox } from 'element-plus'

  const router = useRouter()
  const userStore = useUserStore()

  interface ExceptionData {
    /** 标题 */
    title: string
    /** 描述 */
    desc: string
    /** 按钮文本 */
    btnText: string
    /** 图片地址 */
    imgUrl: string
  }

  withDefaults(
    defineProps<{
      data: ExceptionData
    }>(),
    {}
  )

  const { homePath } = useCommon()

  const backHome = () => {
    const targetHomePath = homePath.value || '/'

    if (!userStore.isLogin) {
      router.push({
        name: 'Login',
        query: { redirect: targetHomePath }
      })
      return
    }

    router.push(targetHomePath)
  }

  const clearCacheAndReload = async () => {
    try {
      await ElMessageBox.confirm(
        '清除缓存会退出登录并刷新页面，是否继续？',
        '清除缓存确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 清除本地存储
      localStorage.clear()
      sessionStorage.clear()

      // 清除 cookies
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      })

      // 清除用户状态并跳转登录页
      userStore.logOut()
    } catch {
      // 用户取消
    }
  }
</script>
