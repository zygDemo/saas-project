import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

/** 用户列表查询参数 */
export class UserQueryDto {
  @ApiPropertyOptional({ description: '用户 ID' })
  @IsOptional()
  id?: string

  @ApiPropertyOptional({ description: '用户名（模糊搜索）' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '性别' })
  @IsOptional()
  @IsString()
  userGender?: string

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  userPhone?: string

  @ApiPropertyOptional({ description: '邮箱（模糊搜索）' })
  @IsOptional()
  @IsString()
  userEmail?: string

  @ApiPropertyOptional({ description: '状态：1-在线 2-离线 3-异常 4-禁用' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '机构 ID' })
  @IsOptional()
  orgId?: string

  @ApiPropertyOptional({ description: '部门 ID' })
  @IsOptional()
  deptId?: string

  @ApiPropertyOptional({ description: '当前页码' })
  current?: number

  @ApiPropertyOptional({ description: '每页条数' })
  size?: number
}
