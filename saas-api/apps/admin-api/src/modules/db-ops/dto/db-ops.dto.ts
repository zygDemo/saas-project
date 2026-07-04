import { ApiProperty } from '@nestjs/swagger'

export class DbStatusResponseDto {
  @ApiProperty({ description: '用户数量', example: 10 })
  users!: number

  @ApiProperty({ description: '角色数量', example: 5 })
  roles!: number

  @ApiProperty({ description: '菜单数量', example: 39 })
  menus!: number

  @ApiProperty({ description: '是否有运维任务正在执行', example: false })
  running!: boolean
}

export class DbOpsResultResponseDto {
  @ApiProperty({ description: '操作是否成功', example: true })
  success!: boolean

  @ApiProperty({ description: '操作结果消息', example: '数据库迁移完成' })
  message!: string

  @ApiProperty({ description: '命令执行输出', example: 'All migrations are up to date.' })
  output!: string
}

export class DbOpsRunAllResponseDto {
  @ApiProperty({ description: '操作是否成功', example: true })
  success!: boolean

  @ApiProperty({ description: '操作结果消息', example: '全部运维操作完成' })
  message!: string

  @ApiProperty({ description: '各步骤执行结果' })
  results!: {
    migrate: string
    seed: string
    syncRoles: string
  }
}
