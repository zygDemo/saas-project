import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class DownloadNovelDto {
  @ApiProperty({
    description: '小说目录页地址',
    example: 'https://www.shushenge.com/476414/'
  })
  @IsNotEmpty()
  @IsUrl()
  url: string

  @ApiProperty({
    description: '小说名称（可选，如果不填则尝试自动获取）',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({
    description: '开始章节序号（从1开始，可选）',
    required: false,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  startChapter?: number

  @ApiProperty({
    description: '结束章节序号（可选）',
    required: false,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  endChapter?: number

  @ApiProperty({
    description: '书籍分类ID（可选）',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number

  @ApiProperty({
    description: '浏览器 Cookie（可选，用于已通过 Cloudflare 验证的网站）',
    required: false
  })
  @IsOptional()
  @IsString()
  cookie?: string

  @ApiProperty({
    description: '浏览器 User-Agent（可选，和 Cookie 配套使用）',
    required: false
  })
  @IsOptional()
  @IsString()
  userAgent?: string

}
