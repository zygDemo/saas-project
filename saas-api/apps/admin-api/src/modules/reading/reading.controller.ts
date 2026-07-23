import { RequestUser } from '../../common/types/request-user'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
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
  UseInterceptors,
  UploadedFile,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
  UpdateReviewStatusDto,
  UploadTxtBookDto,
  CreateReadingNoteDto,
  UpdateReadingNoteDto,
  NoteQueryDto,
} from './dto/reading.dto';

@ApiTags('读书模块')
@Controller('reading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReadingController {
  private readonly logger = new Logger(ReadingController.name)

  constructor(private readonly readingService: ReadingService) {}

  // ==================== 书籍分类 ====================

  @Get('categories')
  @Public()
  @ApiOperation({ summary: '获取书籍分类列表（支持树形结构）' })
  async getCategories(@Request() req: RequestUser, @Query() query: CategoryQueryDto) {
    return this.readingService.getCategories(req.tenantId, query);
  }

  @Get('categories/:id')
  @Public()
  @ApiOperation({ summary: '获取书籍分类详情' })
  async getCategoryById(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.getCategoryById(+id, req.tenantId);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '创建书籍分类' })
  async createCategory(@Request() req: RequestUser, @Body() dto: CreateBookCategoryDto) {
    return this.readingService.createCategory(req.tenantId, dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新书籍分类' })
  async updateCategory(@Param('id') id: number, @Request() req: RequestUser, @Body() dto: UpdateBookCategoryDto) {
    return this.readingService.updateCategory(+id, req.tenantId, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除书籍分类' })
  async deleteCategory(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.deleteCategory(+id, req.tenantId);
  }

  @Post('categories/batch-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '批量启用/禁用分类' })
  async batchUpdateCategoryStatus(@Request() req: RequestUser, @Body() dto: BatchCategoryStatusDto) {
    return this.readingService.batchUpdateCategoryStatus(req.tenantId, dto);
  }

  // ==================== 书籍管理 ====================

  @Get('books')
  @Public()
  @ApiOperation({ summary: '获取书籍列表' })
  async getBooks(@Request() req: RequestUser, @Query() query: BookQueryDto) {
    return this.readingService.getBooks(req.tenantId, query);
  }

  @Get('books/:id')
  @Public()
  @ApiOperation({ summary: '获取书籍详情' })
  async getBookById(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.getBookById(+id, req.tenantId);
  }

  @Post('books')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '创建书籍' })
  async createBook(@Request() req: RequestUser, @Body() dto: CreateBookDto) {
    return this.readingService.createBook(req.tenantId, dto);
  }

  @Post('books/upload-txt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '上传 TXT 文件创建图书（自动分章）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
          cb(null, true);
        } else {
          cb(new Error('仅支持 TXT 文件'), false);
        }
      },
    }),
  )
  async uploadTxtBook(
    @Request() req: RequestUser,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    @Body() dto: UploadTxtBookDto,
  ) {
    this.logger.log(
      `upload-txt: file=${file?.originalname || 'NONE'} size=${file?.size || 0} mime=${file?.mimetype || '-'}`,
    )

    if (!file) {
      throw new BadRequestException('未接收到文件，请确认选择了 .txt 文件')
    }

    try {
      const result = await this.readingService.createBookFromTxt(req.tenantId, file, dto)
      this.logger.log(`upload-txt 成功: bookId=${result.bookId} chapters=${result.chapterCount}`)
      return result
    } catch (error) {
      this.logger.error(
        `upload-txt 失败: ${(error as Error)?.message || error}`,
        (error as Error)?.stack?.slice(0, 300),
      )
      throw error
    }
  }

  @Put('books/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新书籍' })
  async updateBook(@Param('id') id: number, @Request() req: RequestUser, @Body() dto: UpdateBookDto) {
    return this.readingService.updateBook(+id, req.tenantId, dto);
  }

  @Delete('books/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除书籍' })
  async deleteBook(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.deleteBook(+id, req.tenantId);
  }

  // ==================== 章节管理 ====================

  @Get('chapters')
  @Public()
  @ApiOperation({ summary: '获取章节列表' })
  async getChapters(@Request() req: RequestUser, @Query() query: ChapterQueryDto) {
    return this.readingService.getChapters(req.tenantId, query);
  }

  @Get('chapters/lite')
  @Public()
  @ApiOperation({ summary: '获取章节列表（轻量版，仅返回 id/title/sort，无分页）' })
  async getChaptersLite(@Request() req: RequestUser, @Query('bookId') bookId: number) {
    return this.readingService.getChaptersLite(req.tenantId, +bookId);
  }

  @Get('chapters/:id')
  @Public()
  @ApiOperation({ summary: '获取章节详情' })
  async getChapterById(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.getChapterById(+id, req.tenantId);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '创建章节' })
  async createChapter(@Request() req: RequestUser, @Body() dto: CreateChapterDto) {
    return this.readingService.createChapter(req.tenantId, dto);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(@Param('id') id: number, @Request() req: RequestUser, @Body() dto: UpdateChapterDto) {
    return this.readingService.updateChapter(+id, req.tenantId, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.deleteChapter(+id, req.tenantId);
  }

  // ==================== 用户书架 ====================

  @Get('bookshelf')
  @Public()
  @ApiOperation({ summary: '获取用户书架' })
  async getBookshelf(@Request() req: RequestUser) {
    return this.readingService.getBookshelf(req.sub, req.tenantId);
  }

  @Post('bookshelf')
  @Public()
  @ApiOperation({ summary: '加入书架' })
  async addToBookshelf(@Request() req: RequestUser, @Body() dto: AddBookshelfDto) {
    return this.readingService.addToBookshelf(req.sub, req.tenantId, dto);
  }

  @Delete('bookshelf/:bookId')
  @Public()
  @ApiOperation({ summary: '移出书架' })
  async removeFromBookshelf(@Param('bookId') bookId: number, @Request() req: RequestUser) {
    return this.readingService.removeFromBookshelf(req.sub, req.tenantId, +bookId);
  }

  // ==================== 阅读进度 ====================

  @Get('progress/:bookId')
  @Public()
  @ApiOperation({ summary: '获取阅读进度' })
  async getReadingProgress(@Param('bookId') bookId: number, @Request() req: RequestUser) {
    return this.readingService.getReadingProgress(req.sub, req.tenantId, +bookId);
  }

  @Post('progress')
  @Public()
  @ApiOperation({ summary: '保存阅读进度' })
  async saveReadingProgress(@Request() req: RequestUser, @Body() dto: SaveReadingProgressDto) {
    return this.readingService.saveReadingProgress(req.sub, req.tenantId, dto);
  }

  // ==================== 书籍评价 ====================

  @Get('reviews')
  @Public()
  @ApiOperation({ summary: '获取书籍评价' })
  async getReviews(@Request() req: RequestUser, @Query() query: ReviewQueryDto) {
    return this.readingService.getReviews(req.tenantId, query);
  }

  @Post('reviews')
  @Public()
  @ApiOperation({ summary: '创建书籍评价' })
  async createReview(@Request() req: RequestUser, @Body() dto: CreateReviewDto) {
    return this.readingService.createReview(req.sub, req.tenantId, dto);
  }

  @Put('reviews/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '审核评价（通过/驳回）' })
  async updateReviewStatus(@Request() req: RequestUser, @Body() dto: UpdateReviewStatusDto) {
    return this.readingService.updateReviewStatus(req.tenantId, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除评价（管理员）' })
  async deleteReview(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.deleteReview(req.tenantId, +id);
  }

  // ==================== 统计 ====================

  @Get('statistics')
  @Public()
  @ApiOperation({ summary: '获取读书统计（传入 personal=1 查询用户个人统计）' })
  async getStatistics(@Request() req: RequestUser, @Query('personal') personal?: string) {
    const userId = personal === '1' ? req.sub : undefined;
    return this.readingService.getStatistics(req.tenantId, userId);
  }

  @Get('hot')
  @Public()
  @ApiOperation({ summary: '获取热门书籍' })
  async getHotBooks(@Request() req: RequestUser, @Query('limit') limit?: string) {
    return this.readingService.getHotBooks(req.tenantId, limit ? Number(limit) : undefined);
  }

  @Get('recommend')
  @Public()
  @ApiOperation({ summary: '获取推荐书籍' })
  async getRecommendBooks(@Request() req: RequestUser, @Query('limit') limit?: string) {
    return this.readingService.getRecommendBooks(req.tenantId, limit ? Number(limit) : undefined);
  }


  // ==================== 阅读笔记/高亮 ====================

  @Get('notes')
  @Public()
  @ApiOperation({ summary: '获取当前用户的笔记列表' })
  async getNotes(@Request() req: RequestUser, @Query() query: NoteQueryDto) {
    return this.readingService.getNotes(req.tenantId, req.sub, query);
  }

  @Get('notes/chapter/:bookId/:chapterId')
  @Public()
  @ApiOperation({ summary: '获取指定章节的笔记' })
  async getNotesByChapter(
    @Request() req: RequestUser,
    @Param('bookId') bookId: number,
    @Param('chapterId') chapterId: number,
  ) {
    return this.readingService.getNotesByChapter(req.tenantId, req.sub, +bookId, +chapterId);
  }

  @Post('notes')
  @Public()
  @ApiOperation({ summary: '创建笔记/高亮' })
  async createNote(@Request() req: RequestUser, @Body() dto: CreateReadingNoteDto) {
    return this.readingService.createNote(req.tenantId, req.sub, dto);
  }

  @Put('notes/:id')
  @Public()
  @ApiOperation({ summary: '更新笔记' })
  async updateNote(
    @Param('id') id: number,
    @Request() req: RequestUser,
    @Body() dto: UpdateReadingNoteDto,
  ) {
    return this.readingService.updateNote(+id, req.tenantId, req.sub, dto);
  }

  @Delete('notes/:id')
  @Public()
  @ApiOperation({ summary: '删除笔记' })
  async deleteNote(@Param('id') id: number, @Request() req: RequestUser) {
    return this.readingService.deleteNote(+id, req.tenantId, req.sub);
  }


  // ==================== 评论点赞 ====================

  @Post('reviews/:id/like')
  @Public()
  @ApiOperation({ summary: '点赞/取消点赞评论' })
  async likeReview(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser
  ) {
    return this.readingService.likeReview(user.sub, +id)
  }
}