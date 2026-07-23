import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { FoodService } from './food.service'
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
import { GetCurrentUserId } from '../../common/decorators/auth.decorator'

@ApiTags('点餐管理')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('R_SUPER', 'R_ADMIN')
@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  // ==================== 分类管理 ====================

  @Get('category/list')
  @ApiOperation({ summary: '获取菜品分类列表' })
  async getCategoryList(@Query() query: FoodCategoryQueryDto) {
    return this.foodService.getCategoryList(query)
  }

  @Post('category')
  @ApiOperation({ summary: '创建分类' })
  async createCategory(@Body() dto: CreateFoodCategoryDto) {
    return this.foodService.createCategory(dto)
  }

  @Put('category/:id')
  @ApiOperation({ summary: '更新分类' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateFoodCategoryDto) {
    return this.foodService.updateCategory(+id, dto)
  }

  @Delete('category/:id')
  @ApiOperation({ summary: '删除分类' })
  async deleteCategory(@Param('id') id: string) {
    return this.foodService.deleteCategory(+id)
  }

  // ==================== 菜品管理 ====================

  @Get('dish/list')
  @ApiOperation({ summary: '获取菜品列表' })
  async getDishList(@Query() query: FoodDishQueryDto) {
    return this.foodService.getDishList(query)
  }

  @Get('dish/:id')
  @ApiOperation({ summary: '获取菜品详情' })
  async getDishById(@Param('id') id: string) {
    return this.foodService.getDishById(+id)
  }

  @Post('dish')
  @ApiOperation({ summary: '创建菜品' })
  async createDish(@Body() dto: CreateFoodDishDto) {
    return this.foodService.createDish(dto)
  }

  @Put('dish/:id')
  @ApiOperation({ summary: '更新菜品' })
  async updateDish(@Param('id') id: string, @Body() dto: UpdateFoodDishDto) {
    return this.foodService.updateDish(+id, dto)
  }

  @Delete('dish/:id')
  @ApiOperation({ summary: '删除菜品' })
  async deleteDish(@Param('id') id: string) {
    return this.foodService.deleteDish(+id)
  }

  // ==================== 订单管理 ====================

  @Get('order/list')
  @ApiOperation({ summary: '获取订单列表' })
  async getOrderList(@Query() query: FoodOrderQueryDto) {
    return this.foodService.getOrderList(query)
  }

  @Put('order/:id/status')
  @ApiOperation({ summary: '更新订单状态' })
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: number) {
    return this.foodService.updateOrderStatus(+id, status)
  }

  // ==================== 移动端接口 ====================

  @Get('m/menu')
  @ApiOperation({ summary: '获取菜单列表（移动端）' })
  async getMenuList() {
    return this.foodService.getMenuList()
  }

  @Get('m/cart')
  @ApiOperation({ summary: '获取购物车（移动端）' })
  async getCart(@GetCurrentUserId() userId: number) {
    return this.foodService.getCart(userId)
  }

  @Post('m/cart')
  @ApiOperation({ summary: '添加到购物车（移动端）' })
  async addToCart(@GetCurrentUserId() userId: number, @Body() dto: AddCartDto) {
    return this.foodService.addToCart(userId, dto)
  }

  @Put('m/cart/:dishId')
  @ApiOperation({ summary: '更新购物车数量（移动端）' })
  async updateCartQuantity(
    @GetCurrentUserId() userId: number,
    @Param('dishId') dishId: string,
    @Body('quantity') quantity: number
  ) {
    return this.foodService.updateCartQuantity(userId, +dishId, quantity)
  }

  @Delete('m/cart')
  @ApiOperation({ summary: '清空购物车（移动端）' })
  async clearCart(@GetCurrentUserId() userId: number) {
    return this.foodService.clearCart(userId)
  }

  @Post('m/order')
  @ApiOperation({ summary: '创建订单（移动端）' })
  async createOrder(@GetCurrentUserId() userId: number, @Body() dto: CreateFoodOrderDto) {
    return this.foodService.createOrder(userId, dto)
  }

  @Get('m/orders')
  @ApiOperation({ summary: '我的订单列表（移动端）' })
  async getMyOrders(@GetCurrentUserId() userId: number, @Query('status') status?: number) {
    return this.foodService.getMyOrders(userId, status)
  }
}
