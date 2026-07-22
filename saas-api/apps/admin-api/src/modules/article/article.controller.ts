import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { ArticleService } from './article.service'
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  CreateArticleTypeDto,
  ArticleTypeQueryDto
,
  CreateCommentDto,
  CommentQueryDto} from './dto/article.dto'
import { GetCurrentUserId } from '../../common/decorators/auth.decorator'

@ApiTags('文章管理')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: '未授权' })
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // ==================== 文章管理 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '获取文章列表' })
  async getList(@Query() query: ArticleQueryDto) {
    return this.articleService.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async getById(@Param('id') id: string) {
    return this.articleService.getById(+id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post()
  @ApiOperation({ summary: '创建文章' })
  async create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articleService.update(+id, dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  async remove(@Param('id') id: string) {
    return this.articleService.remove(+id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/like')
  @ApiOperation({ summary: '点赞/取消点赞文章' })
  async like(@Param('id') id: string, @GetCurrentUserId() userId: number) {
    return this.articleService.like(+id, userId)
  }

  // ==================== 文章分类 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('type/list')
  @ApiOperation({ summary: '获取文章分类列表' })
  async getTypeList(@Query() query: ArticleTypeQueryDto) {
    return this.articleService.getTypeList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('type/all')
  @ApiOperation({ summary: '获取所有文章分类' })
  async getAllTypes() {
    return this.articleService.getAllTypes()
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('type')
  @ApiOperation({ summary: '创建文章分类' })
  async createType(@Body() dto: CreateArticleTypeDto) {
    return this.articleService.createType(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Put('type/:id')
  @ApiOperation({ summary: '更新文章分类' })
  async updateType(@Param('id') id: string, @Body() dto: Partial<CreateArticleTypeDto>) {
    return this.articleService.updateType(+id, dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Delete('type/:id')
  @ApiOperation({ summary: '删除文章分类' })
  async removeType(@Param('id') id: string) {
    return this.articleService.removeType(+id)
  }


  // ==================== 评论管理 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('comment/list')
  @ApiOperation({ summary: '获取评论列表（分页）' })
  async getComments(@Query() query: CommentQueryDto) {
    return this.articleService.getComments(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id/comments')
  @ApiOperation({ summary: '获取文章评论列表' })
  async getCommentsByArticle(@Param('id') id: string) {
    return this.articleService.getCommentsByArticleId(+id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('comment')
  @ApiOperation({ summary: '发表评论' })
  async createComment(@Body() dto: CreateCommentDto) {
    return this.articleService.createComment(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Delete('comment/:id')
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(@Param('id') id: string) {
    return this.articleService.deleteComment(+id)
  }

}