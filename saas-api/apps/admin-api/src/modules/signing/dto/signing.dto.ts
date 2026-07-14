import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { SignStatus } from '@prisma/client'
import { PageQueryDto, ToDate, ToNumber } from '../../common/dto/common.dto'

export class CreateSigningDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiPropertyOptional({ description: '签约状态', enum: SignStatus })
  @IsOptional()
  @IsEnum(SignStatus)
  status?: SignStatus

  @ApiPropertyOptional({ description: '合同URL' })
  @IsOptional()
  @IsString()
  contractUrl?: string

  @ApiPropertyOptional({ description: '签约时间' })
  @IsOptional()
  @ToDate()
  signedAt?: Date

  @ApiPropertyOptional({ description: '面签视频URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @ToDate()
  expiredAt?: Date

  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  cancelledReason?: string
}


export class UpdateSigningDto extends PartialType(CreateSigningDto) {}


export class SigningQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '签约状态', enum: SignStatus })
  @IsOptional()
  @IsEnum(SignStatus)
  status?: SignStatus
}

