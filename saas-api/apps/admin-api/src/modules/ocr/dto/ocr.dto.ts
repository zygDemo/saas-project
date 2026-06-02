import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class OcrObjectKeyDto {
  @ApiPropertyOptional({ description: '文件上传返回的 objectKey' })
  @IsOptional()
  @IsString()
  objectKey?: string

  @ApiPropertyOptional({ description: '兼容旧字段：文件 key' })
  @IsOptional()
  @IsString()
  fileKey?: string

  @ApiPropertyOptional({ description: '兼容字段：完整文件访问地址' })
  @IsOptional()
  @IsString()
  url?: string

  @ApiPropertyOptional({ description: '兼容字段：完整文件访问地址' })
  @IsOptional()
  @IsString()
  fileUrl?: string

  @ApiPropertyOptional({ description: '身份证正反面', enum: ['front', 'back'] })
  @IsOptional()
  @IsIn(['front', 'back'])
  side?: 'front' | 'back'
}
