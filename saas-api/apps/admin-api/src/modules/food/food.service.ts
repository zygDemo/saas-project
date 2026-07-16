import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import {
  CreateFoodCategoryDto,
  UpdateFoodCategoryDto,
  FoodCategoryQueryDto,
  CreateFoodDishDto,
  UpdateFoodDishDto,
  FoodDishQueryDto,
  FoodOrderQueryDto,
  AddCartDto,
  CreateFoodOrderDto
} from './dto/food.dto'

@Injectable()
export class FoodService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 分类管理 ====================

  async getCategoryList(query: FoodCategoryQueryDto) {
    const tenantId = getCurrentTenantId()
    const pagination = getPagination(query)
    const where: Record<string, unknown> = { tenantId }

    if (query.keyword) {
      where.name = { contains: query.keyword, mode: 'insensitive' }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.foodCategory.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { dishes: true } } }
      }),
      this.prisma.foodCategory.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async createCategory(dto: CreateFoodCategoryDto) {
    const tenantId = getCurrentTenantId()
    return this.prisma.foodCategory.create({
      data: { ...dto, tenantId }
    })
  }

  async updateCategory(id: number, dto: UpdateFoodCategoryDto) {
    const tenantId = getCurrentTenantId()
    const category = await this.prisma.foodCategory.findFirst({ where: { id, tenantId } })
    if (!category) throw new NotFoundException('分类不存在')

    return this.prisma.foodCategory.update({ where: { id }, data: dto })
  }

  async deleteCategory(id: number) {
    const tenantId = getCurrentTenantId()
    const category = await this.prisma.foodCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { dishes: true } } }
    })
    if (!category) throw new NotFoundException('分类不存在')
    if (category._count.dishes > 0) throw new BadRequestException('该分类下还有菜品，无法删除')

    return this.prisma.foodCategory.delete({ where: { id } })
  }

  // ==================== 菜品管理 ====================

  async getDishList(query: FoodDishQueryDto) {
    const tenantId = getCurrentTenantId()
    const pagination = getPagination(query)
    const where: Record<string, unknown> = { tenantId }

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } }
      ]
    }
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.isActive !== undefined) where.isActive = query.isActive

    const [records, total] = await this.prisma.$transaction([
      this.prisma.foodDish.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { sortOrder: 'asc' },
        include: { category: { select: { id: true, name: true } } }
      }),
      this.prisma.foodDish.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async getDishById(id: number) {
    const tenantId = getCurrentTenantId()
    const dish = await this.prisma.foodDish.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true } } }
    })
    if (!dish) throw new NotFoundException('菜品不存在')
    return dish
  }

  async createDish(dto: CreateFoodDishDto) {
    const tenantId = getCurrentTenantId()
    // 验证分类存在
    const category = await this.prisma.foodCategory.findFirst({ where: { id: dto.categoryId, tenantId } })
    if (!category) throw new NotFoundException('分类不存在')

    return this.prisma.foodDish.create({
      data: { ...dto, tenantId },
      include: { category: { select: { id: true, name: true } } }
    })
  }

  async updateDish(id: number, dto: UpdateFoodDishDto) {
    const tenantId = getCurrentTenantId()
    const dish = await this.prisma.foodDish.findFirst({ where: { id, tenantId } })
    if (!dish) throw new NotFoundException('菜品不存在')

    if (dto.categoryId) {
      const category = await this.prisma.foodCategory.findFirst({ where: { id: dto.categoryId, tenantId } })
      if (!category) throw new NotFoundException('分类不存在')
    }

    return this.prisma.foodDish.update({ where: { id }, data: dto })
  }

  async deleteDish(id: number) {
    const tenantId = getCurrentTenantId()
    const dish = await this.prisma.foodDish.findFirst({ where: { id, tenantId } })
    if (!dish) throw new NotFoundException('菜品不存在')

    return this.prisma.foodDish.delete({ where: { id } })
  }

  // ==================== 订单管理 ====================

  async getOrderList(query: FoodOrderQueryDto) {
    const tenantId = getCurrentTenantId()
    const pagination = getPagination(query)
    const where: Record<string, unknown> = { tenantId }

    if (query.status) where.status = query.status
    if (query.orderNo) where.orderNo = { contains: query.orderNo, mode: 'insensitive' }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.foodOrder.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickName: true, phone: true } },
          items: { include: { dish: { select: { id: true, name: true, imageUrl: true } } } }
        }
      }),
      this.prisma.foodOrder.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async updateOrderStatus(id: number, status: number) {
    const tenantId = getCurrentTenantId()
    const order = await this.prisma.foodOrder.findFirst({ where: { id, tenantId } })
    if (!order) throw new NotFoundException('订单不存在')

    return this.prisma.foodOrder.update({
      where: { id },
      data: { status }
    })
  }

  // ==================== 移动端接口 ====================

  /** 获取菜单列表（分组） */
  async getMenuList() {
    const tenantId = getCurrentTenantId()
    const categories = await this.prisma.foodCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        dishes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, description: true, price: true, originalPrice: true, imageUrl: true, salesCount: true }
        }
      }
    })
    return categories.filter(c => c.dishes.length > 0)
  }

  /** 获取购物车 */
  async getCart(userId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.foodCart.findMany({
      where: { userId, tenantId },
      include: { dish: { select: { id: true, name: true, price: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  /** 添加到购物车 */
  async addToCart(userId: number, dto: AddCartDto) {
    const tenantId = getCurrentTenantId()
    const dish = await this.prisma.foodDish.findFirst({ where: { id: dto.dishId, tenantId, isActive: true } })
    if (!dish) throw new NotFoundException('菜品不存在或已下架')

    const existing = await this.prisma.foodCart.findFirst({ where: { userId, dishId: dto.dishId, tenantId } })
    if (existing) {
      return this.prisma.foodCart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (dto.quantity || 1) }
      })
    }

    return this.prisma.foodCart.create({
      data: { userId, dishId: dto.dishId, quantity: dto.quantity || 1, tenantId }
    })
  }

  /** 更新购物车数量 */
  async updateCartQuantity(userId: number, dishId: number, quantity: number) {
    const tenantId = getCurrentTenantId()
    if (quantity <= 0) {
      return this.prisma.foodCart.deleteMany({ where: { userId, dishId, tenantId } })
    }
    return this.prisma.foodCart.updateMany({
      where: { userId, dishId, tenantId },
      data: { quantity }
    })
  }

  /** 清空购物车 */
  async clearCart(userId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.foodCart.deleteMany({ where: { userId, tenantId } })
  }

  /** 创建订单（从购物车） */
  async createOrder(userId: number, dto: CreateFoodOrderDto) {
    const tenantId = getCurrentTenantId()
    const cartItems = await this.prisma.foodCart.findMany({
      where: { userId, tenantId },
      include: { dish: true }
    })
    if (cartItems.length === 0) throw new BadRequestException('购物车为空')

    const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0)
    const orderNo = `FD${Date.now()}`

    const order = await this.prisma.foodOrder.create({
      data: {
        orderNo,
        userId,
        tenantId,
        totalPrice,
        remark: dto.remark,
        items: {
          create: cartItems.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity,
            price: item.dish.price
          }))
        }
      },
      include: { items: true }
    })

    // 清空购物车
    await this.clearCart(userId)

    return order
  }

  /** 我的订单列表 */
  async getMyOrders(userId: number, status?: number) {
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { userId, tenantId }
    if (status) where.status = status

    return this.prisma.foodOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { dish: { select: { id: true, name: true, imageUrl: true } } } }
      }
    })
  }
}
