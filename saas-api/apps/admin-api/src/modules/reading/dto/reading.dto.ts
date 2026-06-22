import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== 书籍分类 ====================

export class CreateBookCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '父分类ID' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsNumber()
  sort?: number;
}

export class UpdateBookCategoryDto extends CreateBookCategoryDto {
  @ApiPropertyOptional({ description: '状态 1:启用 0:禁用' })
  @IsOptional()
  @IsNumber()
  status?: number;
}

export class CategoryQueryDto {
  @ApiPropertyOptional({ description: '是否返回树形结构', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  tree?: boolean;

  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class BatchCategoryStatusDto {
  @ApiProperty({ description: '分类ID列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: '状态 1:启用 0:禁用' })
  @IsNumber()
  status: number;
}

// ==================== 书籍 ====================

export class CreateBookDto {
  @ApiProperty({ description: '书名' })
  @IsString()
  title: string;

  @ApiProperty({ description: '作者' })
  @IsString()
  author: string;

  @ApiPropertyOptional({ description: '封面URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ description: '简介' })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'ISBN' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: '出版社' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ description: '出版日期' })
  @IsOptional()
  @IsString()
  publishDate?: string;

  @ApiPropertyOptional({ description: '字数', default: 0 })
  @IsOptional()
  @IsNumber()
  wordCount?: number;

  @ApiPropertyOptional({ description: '价格', default: 0 })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: '是否免费', default: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ description: '是否VIP', default: false })
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @ApiPropertyOptional({ description: '是否连载', default: true })
  @IsOptional()
  @IsBoolean()
  isSerial?: boolean;

  @ApiPropertyOptional({ description: '标签，逗号分隔' })
  @IsOptional()
  @IsString()
  tags?: string;
}

export class UpdateBookDto extends CreateBookDto {
  @ApiPropertyOptional({ description: '是否热门' })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional({ description: '是否推荐' })
  @IsOptional()
  @IsBoolean()
  isRecommend?: boolean;

  @ApiPropertyOptional({ description: '状态 1:上架 0:下架' })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sort?: number;
}

export class BookQueryDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  status?: number;

  @ApiPropertyOptional({ description: '是否热门' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isHot?: boolean;

  @ApiPropertyOptional({ description: '是否推荐' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRecommend?: boolean;

  @ApiPropertyOptional({ description: '是否完结' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFinished?: boolean;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

// ==================== 章节 ====================

export class CreateChapterDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  bookId: number;

  @ApiProperty({ description: '章节标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '章节内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiPropertyOptional({ description: '是否VIP章节', default: false })
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @ApiPropertyOptional({ description: '章节价格', default: 0 })
  @IsOptional()
  price?: number;
}

export class UpdateChapterDto extends CreateChapterDto {}

export class ChapterQueryDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  @Type(() => Number)
  bookId: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

// ==================== 用户书架 ====================

export class AddBookshelfDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  bookId: number;
}

// ==================== 阅读进度 ====================

export class SaveReadingProgressDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  bookId: number;

  @ApiProperty({ description: '章节ID' })
  @IsNumber()
  chapterId: number;

  @ApiPropertyOptional({ description: '页码', default: 0 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '进度百分比', default: 0 })
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ description: '阅读时长（秒）', default: 0 })
  @IsOptional()
  @IsNumber()
  readTime?: number;
}

// ==================== 书籍评价 ====================

export class CreateReviewDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  bookId: number;

  @ApiProperty({ description: '评分 1-5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: '评价内容' })
  @IsOptional()
  @IsString()
  content?: string;
}

export class ReviewQueryDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  @Type(() => Number)
  bookId: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}
