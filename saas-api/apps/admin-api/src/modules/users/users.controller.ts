import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, Public } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RequestUser } from '../../common/types/request-user'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { UsersService } from './users.service'

@ApiTags('用户管理')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('info')
  @Public()
  @ApiOperation({ summary: '获取当前用户信息', description: '根据 JWT Token 获取当前登录用户的详细信息' })
  info(@CurrentUser() user: RequestUser) {
    return this.usersService.getUserInfo(user.sub)
  }

  @Get('list')
  @Public()
  @ApiOperation({ summary: '获取用户列表', description: '分页查询用户列表，支持关键字搜索' })
  list(@Query() query: UserQueryDto) {
    return this.usersService.getUserList(query)
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增用户', description: '创建用户并绑定角色' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.createUser(dto, user.userName)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑用户', description: '根据用户 ID 更新用户信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.usersService.updateUser(id, dto, user.userName)
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除用户', description: '根据用户 ID 删除用户' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id)
  }
}
