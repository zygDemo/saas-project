import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class DownloadFanqieDto {
  @ApiProperty({ description: '番茄小说URL或纯ID', example: 'https://fanqienovel.com/page/7077516958534470656' })
  @IsNotEmpty() @IsString() url: string

  @ApiProperty({ description: '书名', required: false })
  @IsOptional() @IsString() name?: string

  @ApiProperty({ description: '开始章节', required: false, example: 1 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) startChapter?: number

  @ApiProperty({ description: '结束章节', required: false })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) endChapter?: number

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional() @Type(() => Number) @IsNumber() categoryId?: number
}
