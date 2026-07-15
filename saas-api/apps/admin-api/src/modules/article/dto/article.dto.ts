import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString } from 'class-validator'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题' })
  @IsString()
  title: string

  @ApiPropertyOptional({ description: '文章内容' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: '文章摘要' })
  @IsOptional()
  @IsString()
  summary?: string

  @ApiPropertyOptional({ description: '封面图片' })
  @IsOptional()
  @IsString()
  coverImg?: string

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  typeId?: number

  @ApiPropertyOptional({ description: '分类名称' })
  @IsOptional()
  @IsString()
  typeName?: string

  @ApiPropertyOptional({ description: '状态: DRAFT, PUBLISHED, ARCHIVED' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsOptional()
  isTop?: boolean
}

export class UpdateArticleDto {
  @ApiPropertyOptional({ description: '文章标题' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: '文章内容' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: '文章摘要' })
  @IsOptional()
  @IsString()
  summary?: string

  @ApiPropertyOptional({ description: '封面图片' })
  @IsOptional()
  @IsString()
  coverImg?: string

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  typeId?: number

  @ApiPropertyOptional({ description: '分类名称' })
  @IsOptional()
  @IsString()
  typeName?: string

  @ApiPropertyOptional({ description: '状态: DRAFT, PUBLISHED, ARCHIVED' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsOptional()
  isTop?: boolean
}

export class ArticleQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  typeId?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '年份' })
  @IsOptional()
  @IsString()
  year?: string
}

export class CreateArticleTypeDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sort?: number
}

export class ArticleTypeQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string
}