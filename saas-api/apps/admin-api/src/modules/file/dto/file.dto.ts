import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator'

export function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  })
}

function ToNumberArray() {
  return Transform(({ value }) => {
    if (!Array.isArray(value)) return value
    return value.map((item) => Number(item))
  })
}

export class FileQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number

  @ApiPropertyOptional({ description: '机构ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId?: number

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '业务ID/订单ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  businessId?: number

  @ApiPropertyOptional({ description: '文件分类编码' })
  @IsOptional()
  @IsString()
  categoryCode?: string

  @ApiPropertyOptional({ description: '文件名' })
  @IsOptional()
  @IsString()
  fileName?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

export class CreateFileAssetDto {
  @ApiPropertyOptional({ description: '机构ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId?: number

  @ApiPropertyOptional({ description: '业务类型，如 APPLICATION、SIGNING、DISBURSEMENT' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '业务ID/订单ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  businessId?: number

  @ApiProperty({ description: '分类编码' })
  @IsString()
  categoryCode: string

  @ApiProperty({ description: '分类名称' })
  @IsString()
  categoryName: string

  @ApiProperty({ description: '文件名' })
  @IsString()
  fileName: string

  @ApiProperty({ description: '文件URL' })
  @IsString()
  fileUrl: string

  @ApiPropertyOptional({ description: '对象存储Key' })
  @IsOptional()
  @IsString()
  objectKey?: string

  @ApiPropertyOptional({ description: 'MIME类型' })
  @IsOptional()
  @IsString()
  mimeType?: string

  @ApiPropertyOptional({ description: '文件扩展名' })
  @IsOptional()
  @IsString()
  fileExt?: string

  @ApiPropertyOptional({ description: '文件大小，单位字节' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  fileSize?: number

  @ApiPropertyOptional({ description: '存储类型' })
  @IsOptional()
  @IsString()
  storageType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '上传人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  uploadedBy?: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class UpdateFileAssetDto extends PartialType(CreateFileAssetDto) {}

export class BatchDeleteFileAssetDto {
  @ApiProperty({ description: '文件ID列表', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ToNumberArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[]
}
