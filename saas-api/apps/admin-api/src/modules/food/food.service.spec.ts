import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { FoodService } from './food.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockCategory = {
  id: 1,
  name: '主食',
  isActive: true,
  sortOrder: 1,
  tenantId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const mockDish = {
  id: 1,
  name: '米饭',
  price: 2,
  originalPrice: 3,
  isActive: true,
  sortOrder: 1,
  categoryId: 1,
  tenantId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const mockCartItem = {
  id: 1,
  userId: 1,
  dishId: 1,
  quantity: 2,
  tenantId: 1,
  dish: mockDish,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const mockOrder = {
  id: 1,
  orderNo: 'FD123',
  userId: 1,
  status: 1,
  totalPrice: 4,
  tenantId: 1,
  items: [{ id: 1, dishId: 1, dishName: '米饭', price: 2, quantity: 2 }],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('FoodService', () => {
  let service: FoodService
  let mockPrisma: any

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      foodCategory: {
        findMany: jest.fn().mockResolvedValue([mockCategory]),
        findFirst: jest.fn().mockResolvedValue(mockCategory),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCategory),
        update: jest.fn().mockResolvedValue(mockCategory),
        delete: jest.fn().mockResolvedValue(mockCategory),
      },
      foodDish: {
        findMany: jest.fn().mockResolvedValue([mockDish]),
        findFirst: jest.fn().mockResolvedValue(mockDish),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDish),
        update: jest.fn().mockResolvedValue(mockDish),
        delete: jest.fn().mockResolvedValue(mockDish),
      },
      foodCart: {
        findMany: jest.fn().mockResolvedValue([mockCartItem]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockCartItem),
        update: jest.fn().mockResolvedValue(mockCartItem),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      foodOrder: {
        findMany: jest.fn().mockResolvedValue([mockOrder]),
        findFirst: jest.fn().mockResolvedValue(mockOrder),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockResolvedValue(mockOrder),
      },
      foodOrderItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<FoodService>(FoodService)
  })

  describe('getCategoryList', () => {
    it('应返回分页分类列表', async () => {
      const result = await service.getCategoryList({ page: 1, pageSize: 10 } as any)
      expect(result.list).toEqual([mockCategory])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('createCategory', () => {
    it('应创建分类', async () => {
      const result = await service.createCategory({ name: '主食' } as any)
      expect(result).toEqual(mockCategory)
    })
  })

  describe('updateCategory', () => {
    it('应更新分类', async () => {
      const result = await service.updateCategory(1, { name: '主食2' } as any)
      expect(result).toEqual(mockCategory)
    })
    it('分类不存在应抛异常', async () => {
      mockPrisma.foodCategory.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.updateCategory(999, {} as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteCategory', () => {
    it('应删除无菜品分类', async () => {
      mockPrisma.foodCategory.findFirst = jest.fn().mockResolvedValue({ ...mockCategory, _count: { dishes: 0 } })
      const result = await service.deleteCategory(1)
      expect(mockPrisma.foodCategory.delete).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('分类不存在应抛异常', async () => {
      mockPrisma.foodCategory.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.deleteCategory(999)).rejects.toThrow(NotFoundException)
    })
    it('分类下有菜品应抛异常', async () => {
      mockPrisma.foodCategory.findFirst = jest.fn().mockResolvedValue({ ...mockCategory, _count: { dishes: 1 } })
      await expect(service.deleteCategory(1)).rejects.toThrow(BadRequestException)
    })
  })

  describe('getDishList', () => {
    it('应返回分页菜品列表', async () => {
      const result = await service.getDishList({ page: 1, pageSize: 10 } as any)
      expect(result.list).toEqual([mockDish])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('getDishById', () => {
    it('应返回菜品详情', async () => {
      const result = await service.getDishById(1)
      expect(result).toEqual(mockDish)
    })
  })

  describe('createDish', () => {
    it('应创建菜品', async () => {
      const result = await service.createDish({ categoryId: 1, name: '米饭', price: 2 } as any)
      expect(result).toEqual(mockDish)
    })
    it('分类不存在应抛异常', async () => {
      mockPrisma.foodCategory.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.createDish({ categoryId: 999 } as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateDish', () => {
    it('应更新菜品', async () => {
      const result = await service.updateDish(1, { name: '米饭2' } as any)
      expect(result).toEqual(mockDish)
    })
  })

  describe('deleteDish', () => {
    it('应删除菜品', async () => {
      await service.deleteDish(1)
      expect(mockPrisma.foodDish.delete).toHaveBeenCalled()
    })
  })

  describe('getOrderList', () => {
    it('应返回分页订单列表', async () => {
      const result = await service.getOrderList({ page: 1, pageSize: 10 } as any)
      expect(result.list).toEqual([mockOrder])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('updateOrderStatus', () => {
    it('应更新订单状态', async () => {
      const result = await service.updateOrderStatus(1, 2)
      expect(mockPrisma.foodOrder.update).toHaveBeenCalled()
      expect(result).toEqual(mockOrder)
    })
  })

  describe('getMenuList', () => {
    it('应返回菜单', async () => {
      const result = await service.getMenuList()
      expect(result).toEqual([expect.objectContaining({ id: 1 })])
    })
  })

  describe('购物车', () => {
    it('getCart 应返回购物车', async () => {
      const result = await service.getCart(1)
      expect(result).toEqual([mockCartItem])
    })
    it('addToCart 应添加菜品', async () => {
      const result = await service.addToCart(1, { dishId: 1, quantity: 1 } as any)
      expect(mockPrisma.foodCart.create).toHaveBeenCalled()
      expect(result).toEqual(mockCartItem)
    })
    it('addToCart 已存在应更新数量', async () => {
      mockPrisma.foodCart.findFirst = jest.fn().mockResolvedValue(mockCartItem)
      const result = await service.addToCart(1, { dishId: 1, quantity: 1 } as any)
      expect(mockPrisma.foodCart.update).toHaveBeenCalled()
      expect(result).toEqual(mockCartItem)
    })
    it('updateCartQuantity 应更新数量', async () => {
      const result = await service.updateCartQuantity(1, 1, 5)
      expect(mockPrisma.foodCart.updateMany).toHaveBeenCalled()
      expect(result).toEqual({ count: 1 })
    })
    it('updateCartQuantity 为0应删除', async () => {
      const result = await service.updateCartQuantity(1, 1, 0)
      expect(mockPrisma.foodCart.deleteMany).toHaveBeenCalled()
      expect(result).toEqual({ count: 1 })
    })
    it('clearCart 应清空购物车', async () => {
      const result = await service.clearCart(1)
      expect(mockPrisma.foodCart.deleteMany).toHaveBeenCalled()
      expect(result).toEqual({ count: 1 })
    })
  })

  describe('订单', () => {
    it('createOrder 应创建订单', async () => {
      const result = await service.createOrder(1, { remark: '不要辣' } as any)
      expect(mockPrisma.foodOrder.create).toHaveBeenCalled()
      expect(mockPrisma.foodOrderItem.createMany).toHaveBeenCalled()
      expect(mockPrisma.foodCart.deleteMany).toHaveBeenCalled()
      expect(result).toEqual(mockOrder)
    })
    it('createOrder 购物车为空应抛异常', async () => {
      mockPrisma.foodCart.findMany = jest.fn().mockResolvedValue([])
      await expect(service.createOrder(1, {} as any)).rejects.toThrow(BadRequestException)
    })
    it('getMyOrders 应返回我的订单', async () => {
      const result = await service.getMyOrders(1)
      expect(result).toEqual([mockOrder])
    })
    it('getMyOrders 支持状态筛选', async () => {
      await service.getMyOrders(1, 2)
      const call = mockPrisma.foodOrder.findMany.mock.calls[0][0]
      expect(call.where.status).toBe(2)
    })
  })
})
