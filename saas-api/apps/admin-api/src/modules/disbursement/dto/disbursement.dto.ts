import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { DisbursementStatus } from '@prisma/client'
import { PageQueryDto, ToDate, ToNumber } from '../../common/dto/common.dto'
export class CreateDisbursementDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number
  @ApiPropertyOptional({ description: '放款状态', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus
  @ApiPropertyOptional({ description: 'GPS设备号' })
  @IsOptional()
  @IsString()
  gpsDeviceNo?: string
  @ApiPropertyOptional({ description: 'GPS安装照片' })
  @IsOptional()
  @IsString()
  gpsInstallImg?: string
  @ApiPropertyOptional({ description: 'GPS安装时间' })
  @IsOptional()
  @ToDate()
  gpsInstallAt?: Date
  @ApiPropertyOptional({ description: '抵押状态' })
  @IsOptional()
  @IsString()
  mortgageStatus?: string
  @ApiPropertyOptional({ description: '抵押回执' })
  @IsOptional()
  @IsString()
  mortgageImg?: string
  @ApiPropertyOptional({ description: '抵押时间' })
  @IsOptional()
  @ToDate()
  mortgageAt?: Date
  @ApiPropertyOptional({ description: '实际放款金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  disburseAmount?: number
  @ApiPropertyOptional({ description: '放款账户' })
  @IsOptional()
  @IsString()
  disburseAccount?: string
  @ApiPropertyOptional({ description: '放款时间' })
  @IsOptional()
  @ToDate()
  disburseAt?: Date
  @ApiPropertyOptional({ description: '流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string
  @ApiPropertyOptional({ description: '放款凭证' })
  @IsOptional()
  @IsString()
  voucherUrl?: string
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
export class UpdateDisbursementDto extends PartialType(CreateDisbursementDto) {}
export class DisbursementQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number
  @ApiPropertyOptional({ description: '放款状态', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus
}
export class GpsInstallDto {
  @ApiPropertyOptional({ description: 'GPS设备号' })
  @IsOptional()
  @IsString()
  gpsDeviceNo?: string
  @ApiPropertyOptional({ description: 'GPS安装照片' })
  @IsOptional()
  @IsString()
  gpsInstallImg?: string
  @ApiPropertyOptional({ description: 'GPS安装时间' })
  @IsOptional()
  @IsDateString()
  gpsInstallAt?: string
}
export class MortgageDto {
  @ApiPropertyOptional({ description: '抵押状态' })
  @IsOptional()
  @IsString()
  mortgageStatus?: string
  @ApiPropertyOptional({ description: '抵押凭证图片' })
  @IsOptional()
  @IsString()
  mortgageImg?: string
  @ApiPropertyOptional({ description: '抵押完成时间' })
  @IsOptional()
  @IsDateString()
  mortgageAt?: string
}
export class RequestDisbursementDto {
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
export class ConfirmDisbursementDto {
  @ApiProperty({ description: '放款金额' })
  @IsNumber()
  @Min(0)
  disburseAmount: number
  @ApiPropertyOptional({ description: '放款账户' })
  @IsOptional()
  @IsString()
  disburseAccount?: string
  @ApiPropertyOptional({ description: '交易流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string
  @ApiPropertyOptional({ description: '凭证URL' })
  @IsOptional()
  @IsString()
  voucherUrl?: string
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
  @ApiPropertyOptional({ description: '放款时间' })
  @IsOptional()
  @IsDateString()
  disburseAt?: string
}