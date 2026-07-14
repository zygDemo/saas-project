import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'
import { PageQueryDto } from '../../common/dto/common.dto'

export class CreateThirdPartyServiceDto {
  @ApiProperty({ description: '服务名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '服务编码' })
  @IsString()
  code: string

  @ApiProperty({ description: '类型：SMS, OCR, GPS, CREDIT, PAYMENT' })
  @IsString()
  serviceType: string

  @ApiProperty({ description: '服务商' })
  @IsString()
  provider: string

  @ApiPropertyOptional({ description: 'API地址' })
  @IsOptional()
  @IsString()
  apiUrl?: string

  @ApiPropertyOptional({ description: '配置信息' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>

  @ApiPropertyOptional({ description: '状态', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}


export class UpdateThirdPartyServiceDto extends PartialType(CreateThirdPartyServiceDto) {}


export class ThirdPartyServiceQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配服务名称或编码' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '服务名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '服务编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '服务类型' })
  @IsOptional()
  @IsString()
  serviceType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

