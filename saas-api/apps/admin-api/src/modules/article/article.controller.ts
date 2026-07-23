import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { ArticleService } from './article.service'
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  CreateArticleTypeDto,
  ArticleTypeQueryDto,
  CreateCommentDto,
  CommentQueryDto
} from './dto/article.dto'
import { GetCurrentUserId } from '../../common/decorators/auth.decorator'

@ApiTags('文章管理')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // ==================== 文章管理 ====================

  @Get('list')
  @Public()
  @ApiOperation({ summary: '获取文章列表' })
  async getList(@Query() query: ArticleQueryDto) {
    return this.articleService.getList(query)
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取文章详情' })
  async getById(@Param('id') id: string) {
    return this.articleService.getById(+id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '创建文章' })
  async create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新文章' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articleService.update(+id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除文章' })
  async remove(@Param('id') id: string) {
    return this.articleService.remove(+id)
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '点赞/取消点赞文章' })
  async like(@Param('id') id: string, @GetCurrentUserId() userId: number) {
    return this.articleService.like(+id, userId)
  }

  // ==================== 文章分类 ====================

  @Get('type/list')
  @Public()
  @ApiOperation({ summary: '获取文章分类列表' })
  async getTypeList(@Query() query: ArticleTypeQueryDto) {
    return this.articleService.getTypeList(query)
  }

  @Get('type/all')
  @Public()
  @ApiOperation({ summary: '获取所有文章分类' })
  async getAllTypes() {
    return this.articleService.getAllTypes()
  }

  @Post('type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '创建文章分类' })
  async createType(@Body() dto: CreateArticleTypeDto) {
    return this.articleService.createType(dto)
  }

  @Put('type/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新文章分类' })
  async updateType(@Param('id') id: string, @Body() dto: Partial<CreateArticleTypeDto>) {
    return this.articleService.updateType(+id, dto)
  }

  @Delete('type/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除文章分类' })
  async removeType(@Param('id') id: string) {
    return this.articleService.removeType(+id)
  }


  // ==================== 评论管理 ====================

  @Get('comment/list')
  @Public()
  @ApiOperation({ summary: '获取评论列表（分页）' })
  async getComments(@Query() query: CommentQueryDto) {
    return this.articleService.getComments(query)
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '获取文章评论列表' })
  async getCommentsByArticle(@Param('id') id: string) {
    return this.articleService.getCommentsByArticleId(+id)
  }

  @Post('comment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '发表评论' })
  async createComment(@Body() dto: CreateCommentDto) {
    return this.articleService.createComment(dto)
  }

  @Delete('comment/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(@Param('id') id: string) {
    return this.articleService.deleteComment(id)
  }

}
