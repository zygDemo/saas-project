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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ArticleService } from './article.service'
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  CreateArticleTypeDto,
  ArticleTypeQueryDto
} from './dto/article.dto'
import { GetCurrentUserId } from '../../common/decorators/auth.decorator'

@ApiTags('文章管理')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // ==================== 文章管理 ====================

  @Get('list')
  @ApiOperation({ summary: '获取文章列表' })
  async getList(@Query() query: ArticleQueryDto) {
    return this.articleService.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async getById(@Param('id') id: string) {
    return this.articleService.getById(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  async create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articleService.update(+id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  async remove(@Param('id') id: string) {
    return this.articleService.remove(+id)
  }

  @Post(':id/like')
  @ApiOperation({ summary: '点赞/取消点赞文章' })
  async like(@Param('id') id: string, @GetCurrentUserId() userId: number) {
    return this.articleService.like(+id, userId)
  }

  // ==================== 文章分类 ====================

  @Get('type/list')
  @ApiOperation({ summary: '获取文章分类列表' })
  async getTypeList(@Query() query: ArticleTypeQueryDto) {
    return this.articleService.getTypeList(query)
  }

  @Get('type/all')
  @ApiOperation({ summary: '获取所有文章分类' })
  async getAllTypes() {
    return this.articleService.getAllTypes()
  }

  @Post('type')
  @ApiOperation({ summary: '创建文章分类' })
  async createType(@Body() dto: CreateArticleTypeDto) {
    return this.articleService.createType(dto)
  }

  @Put('type/:id')
  @ApiOperation({ summary: '更新文章分类' })
  async updateType(@Param('id') id: string, @Body() dto: Partial<CreateArticleTypeDto>) {
    return this.articleService.updateType(+id, dto)
  }

  @Delete('type/:id')
  @ApiOperation({ summary: '删除文章分类' })
  async removeType(@Param('id') id: string) {
    return this.articleService.removeType(+id)
  }
}
