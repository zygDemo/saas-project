import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReadingService } from './reading.service';
import {
  CreateBookCategoryDto,
  UpdateBookCategoryDto,
  CategoryQueryDto,
  BatchCategoryStatusDto,
  CreateBookDto,
  UpdateBookDto,
  BookQueryDto,
  CreateChapterDto,
  UpdateChapterDto,
  ChapterQueryDto,
  AddBookshelfDto,
  SaveReadingProgressDto,
  CreateReviewDto,
  ReviewQueryDto,
} from './dto/reading.dto';

@ApiTags('读书模块')
@Controller('reading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  // ==================== 书籍分类 ====================

  @Get('categories')
  @ApiOperation({ summary: '获取书籍分类列表（支持树形结构）' })
  async getCategories(@Request() req: any, @Query() query: CategoryQueryDto) {
    return this.readingService.getCategories(req.user.tenantId, query);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: '获取书籍分类详情' })
  async getCategoryById(@Param('id') id: number, @Request() req: any) {
    return this.readingService.getCategoryById(+id, req.user.tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: '创建书籍分类' })
  async createCategory(@Request() req: any, @Body() dto: CreateBookCategoryDto) {
    return this.readingService.createCategory(req.user.tenantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新书籍分类' })
  async updateCategory(@Param('id') id: number, @Request() req: any, @Body() dto: UpdateBookCategoryDto) {
    return this.readingService.updateCategory(+id, req.user.tenantId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除书籍分类' })
  async deleteCategory(@Param('id') id: number, @Request() req: any) {
    return this.readingService.deleteCategory(+id, req.user.tenantId);
  }

  @Post('categories/batch-status')
  @ApiOperation({ summary: '批量启用/禁用分类' })
  async batchUpdateCategoryStatus(@Request() req: any, @Body() dto: BatchCategoryStatusDto) {
    return this.readingService.batchUpdateCategoryStatus(req.user.tenantId, dto);
  }

  // ==================== 书籍管理 ====================

  @Get('books')
  @ApiOperation({ summary: '获取书籍列表' })
  async getBooks(@Request() req: any, @Query() query: BookQueryDto) {
    return this.readingService.getBooks(req.user.tenantId, query);
  }

  @Get('books/:id')
  @ApiOperation({ summary: '获取书籍详情' })
  async getBookById(@Param('id') id: number, @Request() req: any) {
    return this.readingService.getBookById(+id, req.user.tenantId);
  }

  @Post('books')
  @ApiOperation({ summary: '创建书籍' })
  async createBook(@Request() req: any, @Body() dto: CreateBookDto) {
    return this.readingService.createBook(req.user.tenantId, dto);
  }

  @Put('books/:id')
  @ApiOperation({ summary: '更新书籍' })
  async updateBook(@Param('id') id: number, @Request() req: any, @Body() dto: UpdateBookDto) {
    return this.readingService.updateBook(+id, req.user.tenantId, dto);
  }

  @Delete('books/:id')
  @ApiOperation({ summary: '删除书籍' })
  async deleteBook(@Param('id') id: number, @Request() req: any) {
    return this.readingService.deleteBook(+id, req.user.tenantId);
  }

  // ==================== 章节管理 ====================

  @Get('chapters')
  @ApiOperation({ summary: '获取章节列表' })
  async getChapters(@Request() req: any, @Query() query: ChapterQueryDto) {
    return this.readingService.getChapters(req.user.tenantId, query);
  }

  @Get('chapters/lite')
  @ApiOperation({ summary: '获取章节列表（轻量版，仅返回 id/title/sort，无分页）' })
  async getChaptersLite(@Request() req: any, @Query('bookId') bookId: number) {
    return this.readingService.getChaptersLite(req.user.tenantId, +bookId);
  }

  @Get('chapters/:id')
  @ApiOperation({ summary: '获取章节详情' })
  async getChapterById(@Param('id') id: number, @Request() req: any) {
    return this.readingService.getChapterById(+id, req.user.tenantId);
  }

  @Post('chapters')
  @ApiOperation({ summary: '创建章节' })
  async createChapter(@Request() req: any, @Body() dto: CreateChapterDto) {
    return this.readingService.createChapter(req.user.tenantId, dto);
  }

  @Put('chapters/:id')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(@Param('id') id: number, @Request() req: any, @Body() dto: UpdateChapterDto) {
    return this.readingService.updateChapter(+id, req.user.tenantId, dto);
  }

  @Delete('chapters/:id')
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id') id: number, @Request() req: any) {
    return this.readingService.deleteChapter(+id, req.user.tenantId);
  }

  // ==================== 用户书架 ====================

  @Get('bookshelf')
  @ApiOperation({ summary: '获取用户书架' })
  async getBookshelf(@Request() req: any) {
    return this.readingService.getBookshelf(req.user.sub, req.user.tenantId);
  }

  @Post('bookshelf')
  @ApiOperation({ summary: '加入书架' })
  async addToBookshelf(@Request() req: any, @Body() dto: AddBookshelfDto) {
    return this.readingService.addToBookshelf(req.user.sub, req.user.tenantId, dto);
  }

  @Delete('bookshelf/:bookId')
  @ApiOperation({ summary: '移出书架' })
  async removeFromBookshelf(@Param('bookId') bookId: number, @Request() req: any) {
    return this.readingService.removeFromBookshelf(req.user.sub, req.user.tenantId, +bookId);
  }

  // ==================== 阅读进度 ====================

  @Get('progress/:bookId')
  @ApiOperation({ summary: '获取阅读进度' })
  async getReadingProgress(@Param('bookId') bookId: number, @Request() req: any) {
    return this.readingService.getReadingProgress(req.user.sub, req.user.tenantId, +bookId);
  }

  @Post('progress')
  @ApiOperation({ summary: '保存阅读进度' })
  async saveReadingProgress(@Request() req: any, @Body() dto: SaveReadingProgressDto) {
    return this.readingService.saveReadingProgress(req.user.sub, req.user.tenantId, dto);
  }

  // ==================== 书籍评价 ====================

  @Get('reviews')
  @ApiOperation({ summary: '获取书籍评价' })
  async getReviews(@Request() req: any, @Query() query: ReviewQueryDto) {
    return this.readingService.getReviews(req.user.tenantId, query);
  }

  @Post('reviews')
  @ApiOperation({ summary: '创建书籍评价' })
  async createReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.readingService.createReview(req.user.sub, req.user.tenantId, dto);
  }

  // ==================== 统计 ====================

  @Get('statistics')
  @ApiOperation({ summary: '获取读书统计' })
  async getStatistics(@Request() req: any) {
    return this.readingService.getStatistics(req.user.tenantId);
  }

  @Get('hot')
  @ApiOperation({ summary: '获取热门书籍' })
  async getHotBooks(@Request() req: any, @Query('limit') limit?: number) {
    return this.readingService.getHotBooks(req.user.tenantId, limit);
  }

  @Get('recommend')
  @ApiOperation({ summary: '获取推荐书籍' })
  async getRecommendBooks(@Request() req: any, @Query('limit') limit?: number) {
    return this.readingService.getRecommendBooks(req.user.tenantId, limit);
  }
}