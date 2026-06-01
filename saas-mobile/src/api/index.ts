// api/index.ts
import { http } from 'uview-pro'

export const login = (data: Record<string, unknown>) => http.post('/auth/login', data)

export * from './business'
export * from './auth'
