import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { FoodService } from './food.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockCategory = { id: 1, tenantId: 1, name: '主食', sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }
const mockDish = { id: 1, tenantId: 1, categoryId: 1, name: '炒饭', price: 15, status: 'ON_SHELF', createdAt: new Date(), updatedAt: new Date() }
const mockOrder = { id: 1, tenantId: 1, orderNo: 'F20260101001', status: 'PENDING', totalAmount: 30, createdAt: new Date(), updatedAt: new Date() }

describe('FoodService', () => {
  let service: FoodService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      foodCategory: {
        findMany: jest.fn().mockResolvedValue([mockCategory]),
        findFirst: jest.fn().mockResolvedValue(mockCategory),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCategory),
        update: jest.fn().mockResolvedValue(mockCategory),
      },
      foodDish: {
        findMany: jest.fn().mockResolvedValue([mockDish]),
        findFirst: jest.fn().mockResolvedValue(mockDish),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDish),
        update: jest.fn().mockResolvedValue(mockDish),
      },
      foodOrder: {
        findMany: jest.fn().mockResolvedValue([mockOrder]),
        findFirst: jest.fn().mockResolvedValue(mockOrder),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockResolvedValue(mockOrder),
      },
      foodCart: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1, quantity: 1 }),
        update: jest.fn().mockResolvedValue({ id: 1, quantity: 2 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<FoodService>(FoodService)
  })

  describe('分类管理', () => {
    it('getCategoryList 应返回分页列表', async () => {
      const result = await service.getCategoryList({} as any)
      expect(mockPrisma.foodCategory.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('createCategory 应创建分类', async () => {
      await service.createCategory({ name: '新分类' } as any)
      expect(mockPrisma.foodCategory.create).toHaveBeenCalled()
    })
    it('updateCategory 分类不存在应抛异常', async () => {
      mockPrisma.foodCategory.findFirst.mockResolvedValue(null)
      await expect(service.updateCategory(999, {} as any)).rejects.toThrow(NotFoundException)
    })
    it('deleteCategory 分类不存在应抛异常', async () => {
      mockPrisma.foodCategory.findFirst.mockResolvedValue(null)
      await expect(service.deleteCategory(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('菜品管理', () => {
    it('getDishList 应返回分页列表', async () => {
      const result = await service.getDishList({} as any)
      expect(mockPrisma.foodDish.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('getDishById 应返回菜品详情', async () => {
      const result = await service.getDishById(1)
      expect(result).toEqual(mockDish)
    })
    it('getDishById 不存在应抛异常', async () => {
      mockPrisma.foodDish.findFirst.mockResolvedValue(null)
      await expect(service.getDishById(999)).rejects.toThrow(NotFoundException)
    })
    it('createDish 应创建菜品', async () => {
      await service.createDish({ name: '新菜', price: 20, categoryId: 1 } as any)
      expect(mockPrisma.foodDish.create).toHaveBeenCalled()
    })
    it('updateDish 菜品不存在应抛异常', async () => {
      mockPrisma.foodDish.findFirst.mockResolvedValue(null)
      await expect(service.updateDish(999, {} as any)).rejects.toThrow(NotFoundException)
    })
    it('deleteDish 菜品不存在应抛异常', async () => {
      mockPrisma.foodDish.findFirst.mockResolvedValue(null)
      await expect(service.deleteDish(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('订单管理', () => {
    it('getOrderList 应返回分页列表', async () => {
      const result = await service.getOrderList({} as any)
      expect(mockPrisma.foodOrder.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('updateOrderStatus 应更新状态', async () => {
      await service.updateOrderStatus(1, 'COMPLETED' as any)
      expect(mockPrisma.foodOrder.update).toHaveBeenCalled()
    })
  })

  describe('购物车', () => {
    it('getCart 应返回购物车列表', async () => {
      mockPrisma.foodCart.findMany.mockResolvedValue([{ id: 1, dishId: 1, quantity: 2, dish: mockDish }])
      const result = await service.getCart()
      expect(mockPrisma.foodCart.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('addToCart 新菜品应创建', async () => {
      mockPrisma.foodCart.findFirst.mockResolvedValue(null)
      await service.addToCart({ dishId: 1, quantity: 1 } as any)
      expect(mockPrisma.foodCart.create).toHaveBeenCalled()
    })
    it('addToCart 已有菜品应增加数量', async () => {
      mockPrisma.foodCart.findFirst.mockResolvedValue({ id: 1, quantity: 2 })
      await service.addToCart({ dishId: 1, quantity: 1 } as any)
      expect(mockPrisma.foodCart.update).toHaveBeenCalled()
    })
    it('updateCartQuantity 应更新数量', async () => {
      mockPrisma.foodCart.findFirst.mockResolvedValue({ id: 1 })
      await service.updateCartQuantity(1, 5)
      expect(mockPrisma.foodCart.update).toHaveBeenCalled()
    })
    it('clearCart 应清空购物车', async () => {
      await service.clearCart()
      expect(mockPrisma.foodCart.deleteMany).toHaveBeenCalled()
    })
  })

  describe('下单', () => {
    it('createOrder 购物车为空应抛异常', async () => {
      mockPrisma.foodCart.findMany.mockResolvedValue([])
      await expect(service.createOrder({} as any)).rejects.toThrow()
    })
    it('getMyOrders 应返回我的订单', async () => {
      const result = await service.getMyOrders({} as any)
      expect(mockPrisma.foodOrder.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('菜单', () => {
    it('getMenuList 应返回菜单列表', async () => {
      mockPrisma.foodDish.findMany.mockResolvedValue([mockDish])
      const result = await service.getMenuList()
      expect(result).toBeDefined()
    })
  })
})
