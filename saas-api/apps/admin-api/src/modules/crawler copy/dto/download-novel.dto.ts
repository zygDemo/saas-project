import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class DownloadNovelDto {
  @ApiProperty({
    description: '小说目录页地址',
    example: 'https://www.shushenge.com/476414/',
  })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({
    description: '小说名称（可选，如果不填则尝试自动获取）',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '开始章节序号（从1开始，可选）',
    required: false,
    example: 1,
  })
  @IsOptional()
  startChapter?: number;

  @ApiProperty({
    description: '结束章节序号（可选）',
    required: false,
    example: 10,
  })
  @IsOptional()
  endChapter?: number;
}
