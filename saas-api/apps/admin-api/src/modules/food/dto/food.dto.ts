import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

// ==================== 分类 ====================

export class CreateFoodCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number
}

export class UpdateFoodCategoryDto {
  @ApiPropertyOptional({ description: '分类名称' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  isActive?: boolean
}

export class FoodCategoryQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string
}

// ==================== 菜品 ====================

export class CreateFoodDishDto {
  @ApiProperty({ description: '菜品名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '价格' })
  @ToNumber()
  @IsNumber()
  price: number

  @ApiPropertyOptional({ description: '原价' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  originalPrice?: number

  @ApiPropertyOptional({ description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string

  @ApiProperty({ description: '分类ID' })
  @ToNumber()
  @IsInt()
  categoryId: number

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number
}

export class UpdateFoodDishDto {
  @ApiPropertyOptional({ description: '菜品名称' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '价格' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  price?: number

  @ApiPropertyOptional({ description: '原价' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  originalPrice?: number

  @ApiPropertyOptional({ description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  categoryId?: number

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  isActive?: boolean
}

export class FoodDishQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  categoryId?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  isActive?: boolean
}

// ==================== 订单 ====================

export class FoodOrderQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '状态: 1=待接单 2=制作中 3=已完成 4=已取消' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  status?: number

  @ApiPropertyOptional({ description: '订单号' })
  @IsOptional()
  @IsString()
  orderNo?: string
}

// ==================== 移动端接口 ====================

export class AddCartDto {
  @ApiProperty({ description: '菜品ID' })
  @ToNumber()
  @IsInt()
  dishId: number

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  quantity?: number
}

export class CreateFoodOrderDto {
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
