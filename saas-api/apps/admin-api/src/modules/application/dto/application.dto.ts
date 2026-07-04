import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import {
  ApplicationQueryDto,
  CreateApplicationDto,
  IdParamDto,
  ToNumber,
  UpdateApplicationDto
} from '../../business-common.dto'

export { ApplicationQueryDto, CreateApplicationDto, IdParamDto, UpdateApplicationDto }

export class OrderListQueryDto extends ApplicationQueryDto {
  @ApiPropertyOptional({ description: '当前页，兼容移动端 pageNum 字段', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageNum?: number

  @ApiPropertyOptional({ description: '每页数量，兼容移动端 pageSize 字段', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageSize?: number

  @ApiPropertyOptional({ description: '订单号/申请编号，模糊查询' })
  @IsOptional()
  @IsString()
  orderNo?: string

  @ApiPropertyOptional({ description: '授信订单号，兼容移动端字段，模糊查询' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiPropertyOptional({ description: '客户姓名，模糊查询' })
  @IsOptional()
  @IsString()
  personName?: string

  @ApiPropertyOptional({ description: '客户姓名，兼容 customerName 字段，模糊查询' })
  @IsOptional()
  @IsString()
  customerName?: string

  @ApiPropertyOptional({ description: '客户姓名，兼容 name 字段，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '手机号，模糊查询' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: '手机号，兼容 telephone 字段，模糊查询' })
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional({ description: '车牌号，模糊查询' })
  @IsOptional()
  @IsString()
  plateNumber?: string

  @ApiPropertyOptional({ description: '节点编码，兼容 nodeCode 字段' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  nodeCode?: number

  @ApiPropertyOptional({ description: '业务节点字符串编码，如 PRE_AUDIT、SIGN_CONTRACT' })
  @IsOptional()
  @IsString()
  businessNode?: string

  @ApiPropertyOptional({ description: '节点状态，兼容 nodeStatus 字段' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  nodeStatus?: number

  @ApiPropertyOptional({ description: '关键字，匹配订单号、姓名、手机号、车牌号' })
  @IsOptional()
  @IsString()
  keyword?: string
}
