import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../common/types/request-user'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('info')
  @ApiOperation({ summary: '获取当前用户信息', description: '根据 JWT Token 获取当前登录用户的详细信息' })
  info(@CurrentUser() user: RequestUser) {
    return this.usersService.getUserInfo(user.sub)
  }

  @Get('list')
  @ApiOperation({ summary: '获取用户列表', description: '分页查询用户列表，支持关键字搜索' })
  @ApiQuery({ name: 'page', description: '页码', required: false, example: '1' })
  @ApiQuery({ name: 'pageSize', description: '每页条数', required: false, example: '10' })
  @ApiQuery({ name: 'keyword', description: '搜索关键字（用户名/昵称）', required: false })
  list(@Query() query: Record<string, string | undefined>) {
    return this.usersService.getUserList(query)
  }

  @Post('create')
  @ApiOperation({ summary: '新增用户', description: '创建用户并绑定角色' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.createUser(dto, user.userName)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.usersService.updateUser(id, dto, user.userName)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id)
  }
}
