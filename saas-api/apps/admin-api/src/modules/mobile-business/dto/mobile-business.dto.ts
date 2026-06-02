import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  })
}

export class MobileUuidQueryDto {
  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string
}

export class MobileUserListQueryDto {
  @ApiPropertyOptional({ description: '数据来源' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  dataSource?: number

  @ApiPropertyOptional({ description: '客户姓名' })
  @IsOptional()
  @IsString()
  personName?: string
}

export class MobileCreditListQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number

  @ApiPropertyOptional({ description: '业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  salesmanId?: number

  @ApiPropertyOptional({ description: '业务节点' })
  @IsOptional()
  @IsString()
  businessNode?: string

  @ApiPropertyOptional({ description: '客户姓名' })
  @IsOptional()
  @IsString()
  personName?: string
}

export class MobileIdCardInfoDto {
  @ApiPropertyOptional({ description: '客户唯一标识，编辑时传入' })
  @IsOptional()
  @IsString()
  uuid?: string

  @ApiPropertyOptional({ description: '业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  salesmanId?: number

  @ApiProperty({ description: '姓名' })
  @IsString()
  personName: string

  @ApiProperty({ description: '手机号' })
  @IsString()
  telephone: string

  @ApiProperty({ description: '身份证号' })
  @IsString()
  personIdcard: string

  @ApiPropertyOptional({ description: '性别，1男 2女' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  gender?: number

  @ApiPropertyOptional({ description: '年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  age?: number

  @ApiPropertyOptional({ description: '民族' })
  @IsOptional()
  @IsString()
  race?: string

  @ApiPropertyOptional({ description: '身份证地址' })
  @IsOptional()
  @IsString()
  personAddress?: string

  @ApiPropertyOptional({ description: '签发机关' })
  @IsOptional()
  @IsString()
  personIssuingAuthority?: string

  @ApiPropertyOptional({ description: '有效期起' })
  @IsOptional()
  @IsString()
  personValidDateStart?: string

  @ApiPropertyOptional({ description: '有效期止' })
  @IsOptional()
  @IsString()
  personValidDateEnd?: string

  @ApiPropertyOptional({ description: '身份证人像面 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  idcardFront?: string

  @ApiPropertyOptional({ description: '身份证国徽面 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  idcardBack?: string
}

export class MobileVehicleInfoDto {
  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string

  @ApiPropertyOptional({ description: '行驶证主页 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  vehicleImgUrl?: string

  @ApiProperty({ description: '车牌号码' })
  @IsString()
  plateNumber: string

  @ApiPropertyOptional({ description: '车辆品牌' })
  @IsOptional()
  @IsString()
  vehicleBrand?: string

  @ApiProperty({ description: '车型' })
  @IsString()
  vehicleModel: string

  @ApiProperty({ description: '所属人姓名' })
  @IsString()
  vehicleOwner: string

  @ApiProperty({ description: '住址' })
  @IsString()
  address: string

  @ApiProperty({ description: '使用性质' })
  @IsString()
  usageNature: string

  @ApiProperty({ description: '印章信息' })
  @IsString()
  sealInfo: string

  @ApiProperty({ description: '发动机号' })
  @IsString()
  engineNumber: string

  @ApiProperty({ description: '注册日期' })
  @IsString()
  registerDate: string

  @ApiProperty({ description: '车辆识别代码' })
  @IsString()
  vehicleCode: string

  @ApiProperty({ description: '行驶里程' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  mileage: number

  @ApiPropertyOptional({ description: '购买方式' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  purchaseType?: number

  @ApiPropertyOptional({ description: '购买日期' })
  @IsOptional()
  @IsString()
  purchaseDate?: string

  @ApiPropertyOptional({ description: '购买金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  purchasePrice?: number

  @ApiPropertyOptional({ description: '贷款金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  loanAmount?: number

  @ApiPropertyOptional({ description: '贷款期限' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  loanTerm?: number

  @ApiPropertyOptional({ description: '月还款金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  monthlyPayment?: number

  @ApiPropertyOptional({ description: '燃油类型' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  fuelType?: number

  @ApiPropertyOptional({ description: '车辆颜色' })
  @IsOptional()
  @IsString()
  vehicleColor?: string

  @ApiPropertyOptional({ description: '是否故障' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isFault?: number

  @ApiPropertyOptional({ description: '是否抵押' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isMortgage?: number

  @ApiPropertyOptional({ description: '是否投保' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isInsurance?: number

  @ApiPropertyOptional({ description: '保险到期日' })
  @IsOptional()
  @IsString()
  insuranceExpirationDate?: string
}

export class MobileCreditApplyDto {
  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string

  @ApiProperty({ description: '申请金额，元' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  amount: number

  @ApiProperty({ description: '贷款期数' })
  @ToNumber()
  @IsInt()
  @Min(1)
  periods: number

  @ApiPropertyOptional({ description: '业务类型，例如 pawn' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '订单类型' })
  @IsOptional()
  @IsString()
  orderType?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '停车费' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  parkingFee?: number

  @ApiPropertyOptional({ description: '车辆状态' })
  @IsOptional()
  @IsString()
  vehicleStatus?: string

  @ApiPropertyOptional({ description: '车库' })
  @IsOptional()
  @IsString()
  garage?: string

  @ApiPropertyOptional({ description: '门店' })
  @IsOptional()
  @IsString()
  storeName?: string

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  ownerName?: string

  @ApiPropertyOptional({ description: '押金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  deposit?: number
}

export class MobileCreditUpdateDto extends PartialType(MobileCreditApplyDto) {
  @ApiProperty({ description: '授信订单号' })
  @IsString()
  creditOrderId: string
}
