import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateCommentDto {
  @ApiProperty({ description: '文章ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  articleId: number

  @ApiProperty({ description: '评论内容' })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '父评论ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  parentId?: number
}

export class CommentQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '文章ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  articleId?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}
