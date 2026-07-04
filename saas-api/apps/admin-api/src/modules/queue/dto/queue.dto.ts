import { ApiProperty } from '@nestjs/swagger'

export class QueueJobResponseDto {
  @ApiProperty({ description: '任务 ID', example: '1' })
  id!: string

  @ApiProperty({ description: '任务名称', example: 'health-check' })
  name!: string
}
