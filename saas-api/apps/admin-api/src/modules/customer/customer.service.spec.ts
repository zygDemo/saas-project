import { Test, TestingModule } from '@nestjs/testing'
import { CustomerService } from './customer.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('CustomerService', () => {
  let service: CustomerService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeCustomer = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    orgId: 1,
    name: '张三',
    phone: '13800138000',
    idCard: '110101199001011234',
    status: 'ACTIVE',
    deletedAt: null,
    org: { id: 1, name: '测试机构' },
    contacts: [],
    vehicles: [],
    bankCards: [],
    applications: [],
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      customer: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      organization: { findFirst: jest.fn() },
      customerContact: { create: jest.fn() },
      vehicle: { create: jest.fn() },
      bankCard: {
        create: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn()
      },
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<CustomerService>(CustomerService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CRUD
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建客户', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.customer.create!.mockResolvedValue(makeCustomer())

      await service.create({
        orgId: 1,
        name: '张三',
        phone: '13800138000',
        idCard: '110101199001011234'
      })

      expect(result.id).toBe(1)
      expect(result.name).toBe('张三')
      expect(mockPrisma.customer.create).toHaveBeenCalled()
    })

    it('机构不存在时应抛出异常', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ orgId: 999, name: '张三', phone: '13800138000' })
      ).rejects.toThrow('机构不存在')
    })

    it('创建时应该自动添加 tenantId', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.customer.create!.mockResolvedValue(makeCustomer())

      await service.create({ orgId: 1, name: '张三', phone: '13800138000' })

      expect(mockPrisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 1 })
        })
      )
    })

    it('创建时应支持嵌套创建联系人、车辆、银行卡', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.customer.create!.mockResolvedValue(makeCustomer())

      await service.create({
        orgId: 1,
        name: '张三',
        phone: '13800138000',
        contacts: [{ name: '李四', phone: '13900139000', relation: '配偶' }],
        vehicles: [{ plateNumber: '京A12345', brand: '宝马', model: 'X5' }],
        bankCards: [{ bankName: '工商银行', cardNo: '622200000000', cardType: 'DEBIT', isDefault: true }]
      })

      expect(mockPrisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contacts: { create: [{ name: '李四', phone: '13900139000', relation: '配偶' }] },
            vehicles: { create: [{ plateNumber: '京A12345', brand: '宝马', model: 'X5' }] },
            bankCards: { create: [{ bankName: '工商银行', cardNo: '622200000000', cardType: 'DEBIT', isDefault: true }] }
          })
        })
      )
    })
  })

  describe('getList', () => {
    it('应该返回分页客户列表', async () => {
      mockPrisma.customer.count!.mockResolvedValue(2)
      mockPrisma.customer.findMany!.mockResolvedValue([makeCustomer()])

      await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(2)
    })

    it('应该支持按姓名模糊搜索', async () => {
      mockPrisma.customer.count!.mockResolvedValue(0)
      mockPrisma.customer.findMany!.mockResolvedValue([])

      await service.getList({ name: '张三', current: 1, size: 10 })

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: '张三', mode: 'insensitive' },
            deletedAt: null
          })
        })
      )
    })

    it('应该支持按手机号模糊搜索', async () => {
      mockPrisma.customer.count!.mockResolvedValue(0)
      mockPrisma.customer.findMany!.mockResolvedValue([])

      await service.getList({ phone: '138', current: 1, size: 10 })

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: { contains: '138', mode: 'insensitive' }
          })
        })
      )
    })

    it('应该支持按机构ID精确筛选', async () => {
      mockPrisma.customer.count!.mockResolvedValue(0)
      mockPrisma.customer.findMany!.mockResolvedValue([])

      await service.getList({ orgId: 1, current: 1, size: 10 })

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 1 })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回客户详情及关联数据', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(
        makeCustomer({
          contacts: [{ id: 1, name: '李四', phone: '13900139000' }],
          vehicles: [{ id: 1, plateNumber: '京A12345', brand: '宝马' }],
          bankCards: [{ id: 1, bankName: '工商银行', cardNo: '622200000000' }],
          applications: [{ id: 1, applicationNo: 'APP-001' }]
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.contacts).toHaveLength(1)
      expect(result.vehicles).toHaveLength(1)
      expect(result.bankCards).toHaveLength(1)
      expect(result.applications).toHaveLength(1)
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  ADD CONTACT
  // ═══════════════════════════════════════════════════════════════
  describe('addContact', () => {
    it('应该成功添加联系人', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.customerContact.create!.mockResolvedValue({
        id: 1,
        customerId: 1,
        name: '李四',
        phone: '13900139000',
        relation: '配偶'
      })

      await service.addContact(1, {
        name: '李四',
        phone: '13900139000',
        relation: '配偶'
      })

      expect(result.name).toBe('李四')
      expect(mockPrisma.customerContact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerId: 1 })
        })
      )
    })

    it('客户不存在时应抛出异常', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(null)

      await expect(
        service.addContact(999, { name: '李四', phone: '13900139000', relation: '配偶' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  ADD VEHICLE
  // ═══════════════════════════════════════════════════════════════
  describe('addVehicle', () => {
    it('应该成功添加车辆', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.vehicle.create!.mockResolvedValue({
        id: 1,
        customerId: 1,
        plateNumber: '京A12345',
        brand: '宝马',
        model: 'X5'
      })

      await service.addVehicle(1, {
        plateNumber: '京A12345',
        brand: '宝马',
        model: 'X5'
      })

      expect(result.plateNumber).toBe('京A12345')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  ADD BANK CARD
  // ═══════════════════════════════════════════════════════════════
  describe('addBankCard', () => {
    it('应该成功添加银行卡', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.bankCard.count!.mockResolvedValue(0)
      mockPrisma.bankCard.create!.mockResolvedValue({
        id: 1,
        customerId: 1,
        bankName: '工商银行',
        cardNo: '622200000000',
        isDefault: true
      })

      await service.addBankCard(1, {
        bankName: '工商银行',
        cardNo: '622200000000',
        cardType: 'DEBIT',
        isDefault: true
      })

      expect(result.bankName).toBe('工商银行')
    })

    it('设为默认卡时应先清除其他默认卡', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.bankCard.count!.mockResolvedValue(1)
      mockPrisma.bankCard.create!.mockResolvedValue({ id: 2 } as any)

      await service.addBankCard(1, {
        bankName: '建设银行',
        cardNo: '622700000000',
        cardType: 'DEBIT',
        isDefault: true
      })

      expect(mockPrisma.bankCard.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 1 },
          data: { isDefault: false }
        })
      )
    })

    it('银行卡数量达上限时应抛出异常', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.bankCard.count!.mockResolvedValue(10)

      await expect(
        service.addBankCard(1, { bankName: '招商银行', cardNo: '622500000000', cardType: 'DEBIT' })
      ).rejects.toThrow('银行卡数量已达上限')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新客户信息', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.customer.update!.mockResolvedValue(makeCustomer({ name: '李四' }))

      await service.update(1, { orgId: 1, name: '李四' })

      expect(mockPrisma.customer.update).toHaveBeenCalled()
    })

    it('不存在的客户应抛出 NotFoundException', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(null)

      await expect(service.update(999, { orgId: 1, name: '李四' })).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('应该软删除客户', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(makeCustomer())
      mockPrisma.customer.update!.mockResolvedValue({ id: 1 })

      await service.remove(1)

      expect(result.id).toBe(1)
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) })
        })
      )
    })
  })
})
