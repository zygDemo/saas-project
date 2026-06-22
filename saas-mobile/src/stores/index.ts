import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate' // 数据持久化

const pinia = createPinia()

pinia.use(
  createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }),
)

export default pinia

export * from './counter'
export * from './local'
export * from './session'
export * from './tabbar'

export * from './carloan'
export * from './reading'
