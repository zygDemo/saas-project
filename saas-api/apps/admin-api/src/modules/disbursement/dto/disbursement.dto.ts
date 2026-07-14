export { CreateDisbursementDto, UpdateDisbursementDto, DisbursementQueryDto, IdParamDto } from '../../business-common.dto'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'

/** GPS安装登记 DTO */
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

/** 抵押登记 DTO */
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

/** 出账申请 DTO */
export class RequestDisbursementDto {
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

/** 放款确认 DTO */
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
