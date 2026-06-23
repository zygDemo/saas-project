import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ToNumber } from '../../business-common.dto'

export {
  CreateFlowConfigDto,
  UpdateFlowConfigDto,
  FlowConfigQueryDto,
  IdParamDto
} from '../../business-common.dto'

export class InitDefaultFlowConfigDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiPropertyOptional({ description: '业务类型', default: 'CAR_LOAN' })
  @IsOptional()
  @IsString()
  businessType?: string
}
