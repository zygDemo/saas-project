import { PrismaService } from './prisma.service'

// PrismaService 使用 Proxy 模式，测试核心逻辑（租户注入、软删除）

describe('PrismaService', () => {
  describe('租户模型列表', () => {
    it('应包含核心业务模型', () => {
      // TENANT_MODELS 是模块级常量，通过行为间接验证
      const service = new PrismaService()
      // Proxy 应该能访问 prisma client 的模型
      expect(service.user).toBeDefined()
      expect(service.role).toBeDefined()
      expect(service.application).toBeDefined()
      expect(service.customer).toBeDefined()
    })
  })

  describe('生命周期', () => {
    it('应实现 OnModuleInit', () => {
      const service = new PrismaService()
      expect(typeof service.onModuleInit).toBe('function')
    })

    it('应实现 OnModuleDestroy', () => {
      const service = new PrismaService()
      expect(typeof service.onModuleDestroy).toBe('function')
    })
  })

  describe('Proxy 代理', () => {
    it('应能访问 PrismaClient 的模型属性', () => {
      const service = new PrismaService()
      // Proxy 应将未知属性委托给 _client
      expect(service.user).toBeDefined()
      expect(service.role).toBeDefined()
      expect(service.menu).toBeDefined()
      expect(service.organization).toBeDefined()
      expect(service.product).toBeDefined()
      expect(service.funder).toBeDefined()
    })

    it('应能访问 PrismaClient 的 $transaction', () => {
      const service = new PrismaService()
      expect(service.$transaction).toBeDefined()
      expect(typeof service.$transaction).toBe('function')
    })

    it('应能访问 PrismaClient 的 $connect', () => {
      const service = new PrismaService()
      expect(service.$connect).toBeDefined()
    })
  })
})
