import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { Gender } from '@prisma/client'
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min , ValidateNested } from 'class-validator'
import { OrgScopedQueryDto, ToBoolean, ToDate, ToNumber } from '../../common/dto/common.dto'
export class CustomerContactDto {
  @ApiProperty({ description: '联系人姓名' })
  @IsString()
  name: string
  @ApiProperty({ description: '关系' })
  @IsString()
  relation: string
  @ApiProperty({ description: '手机号' })
  @IsString()
  phone: string
  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string
  @ApiPropertyOptional({ description: '是否紧急联系人' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isEmergency?: boolean
}
export class VehicleDto {
  @ApiPropertyOptional({ description: '车架号' })
  @IsOptional()
  @IsString()
  vin?: string
  @ApiPropertyOptional({ description: '车牌号' })
  @IsOptional()
  @IsString()
  plateNumber?: string
  @ApiPropertyOptional({ description: '品牌' })
  @IsOptional()
  @IsString()
  brand?: string
  @ApiPropertyOptional({ description: '车型' })
  @IsOptional()
  @IsString()
  model?: string
  @ApiPropertyOptional({ description: '颜色' })
  @IsOptional()
  @IsString()
  color?: string
  @ApiPropertyOptional({ description: '年份' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1900)
  year?: number
  @ApiPropertyOptional({ description: '里程' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  mileage?: number
  @ApiPropertyOptional({ description: '购买价格' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  purchasePrice?: number
  @ApiPropertyOptional({ description: '评估价' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  estimateValue?: number
  @ApiPropertyOptional({ description: '是否抵押' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isMortgaged?: boolean
  @ApiPropertyOptional({ description: '抵押信息' })
  @IsOptional()
  @IsString()
  mortgageInfo?: string
}
export class BankCardDto {
  @ApiProperty({ description: '银行名称' })
  @IsString()
  bankName: string
  @ApiProperty({ description: '卡号' })
  @IsString()
  cardNo: string
  @ApiProperty({ description: '卡类型' })
  @IsString()
  cardType: string
  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isDefault?: boolean
}
export class CreateCustomerDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number
  @ApiProperty({ description: '姓名' })
  @IsString()
  name: string
  @ApiProperty({ description: '手机号' })
  @IsString()
  phone: string
  @ApiPropertyOptional({ description: '身份证号' })
  @IsOptional()
  @IsString()
  idCard?: string
  @ApiPropertyOptional({ description: '性别', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender
  @ApiPropertyOptional({ description: '出生日期' })
  @IsOptional()
  @ToDate()
  birthDate?: Date
  @ApiPropertyOptional({ description: '婚姻状态' })
  @IsOptional()
  @IsString()
  maritalStatus?: string
  @ApiPropertyOptional({ description: '学历' })
  @IsOptional()
  @IsString()
  education?: string
  @ApiPropertyOptional({ description: '职业' })
  @IsOptional()
  @IsString()
  occupation?: string
  @ApiPropertyOptional({ description: '公司名称' })
  @IsOptional()
  @IsString()
  companyName?: string
  @ApiPropertyOptional({ description: '月收入' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number
  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string
  @ApiPropertyOptional({ description: '紧急联系人' })
  @IsOptional()
  @IsString()
  emergencyName?: string
  @ApiPropertyOptional({ description: '紧急联系人手机号' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string
  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
  @ApiPropertyOptional({ description: '联系人列表', type: [CustomerContactDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomerContactDto)
  contacts?: CustomerContactDto[]
  @ApiPropertyOptional({ description: '车辆列表', type: [VehicleDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  vehicles?: VehicleDto[]
  @ApiPropertyOptional({ description: '银行卡列表', type: [BankCardDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BankCardDto)
  bankCards?: BankCardDto[]
}
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
export class CustomerQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '姓名，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string
  @ApiPropertyOptional({ description: '手机号，模糊查询' })
  @IsOptional()
  @IsString()
  phone?: string
  @ApiPropertyOptional({ description: '身份证号，模糊查询' })
  @IsOptional()
  @IsString()
  idCard?: string
  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}