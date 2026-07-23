
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, Public } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateMsgTemplateDto, MsgTemplateQueryDto, UpdateMsgTemplateDto } from './dto/msg-template.dto'
import { MsgTemplateService } from './msg-template.service'

@ApiTags('消息模板')
@Controller('msg-template')
export class MsgTemplateController {
  constructor(private readonly service: MsgTemplateService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '获取消息模板列表' })
  list(@Query() query: MsgTemplateQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取消息模板详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetail(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增消息模板' })
  create(@Body() dto: CreateMsgTemplateDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑消息模板' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMsgTemplateDto) {
    return this.service.update(id, dto)
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '启用消息模板' })
  enable(@Param('id', ParseIntPipe) id: number) {
    return this.service.enable(id)
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '停用消息模板' })
  disable(@Param('id', ParseIntPipe) id: number) {
    return this.service.disable(id)
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除消息模板' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
