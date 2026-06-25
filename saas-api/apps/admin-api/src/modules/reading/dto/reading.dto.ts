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

export class UpdateChapterDto {
  @ApiPropertyOptional({ description: '章节标题' })
  @IsOptional()
  @IsString()
  title?: string;

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

export class ChapterQueryDto {
  @ApiProperty({ description: '书籍ID' })
  @IsNumber()
  @Type(() => Number)
  bookId: number;

  @ApiPropertyOptional({ description: '章节标题关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 100, maximum: 200 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
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
  @Type(() => Number)
  bookId: number;

  @ApiProperty({ description: '章节ID' })
  @IsNumber()
  @Type(() => Number)
  chapterId: number;

  @ApiPropertyOptional({ description: '页码', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '进度百分比', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  progress?: number;

  @ApiPropertyOptional({ description: '阅读时长（秒）', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
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
  @ApiPropertyOptional({ description: '书籍ID（管理员查询所有评价时可不传）' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bookId?: number;

  @ApiPropertyOptional({ description: '评价内容关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '审核状态 0:待审核 1:已通过 2:已驳回' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  status?: number;

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

export class UpdateReviewStatusDto {
  @ApiProperty({ description: '评价ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '审核状态 1:通过 2:驳回' })
  @IsNumber()
  status: number;
}

export class UploadTxtBookDto {
  @ApiPropertyOptional({ description: '书名（不传则用文件名）' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '作者', default: '未知' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: '简介' })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional({ description: '标签，逗号分隔' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: '章节识别正则（默认匹配"第X章/回/节"等）' })
  @IsOptional()
  @IsString()
  chapterRegex?: string;
}
