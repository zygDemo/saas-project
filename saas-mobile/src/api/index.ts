// api/index.ts
import { http } from 'uview-pro'

export const login = (data: Record<string, unknown>) => http.post('/auth/login', data)
export const getUser = (id: string) => http.get('/api/user', { id })

export * from './business'
export * from './auth'
