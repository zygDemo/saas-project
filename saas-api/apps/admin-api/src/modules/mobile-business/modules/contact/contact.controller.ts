
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Public } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { MobileContactDto } from '../../dto/mobile-business.dto'
import { MobileContactService } from '../../mobile-contact.service'

@ApiTags('移动端联系人')
@Controller('m/contact')
export class MobileContactController {
  constructor(private readonly contactService: MobileContactService) {}

  @Post('addOrUpdateContact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增/更新联系人' })
  addOrUpdateContact(@Body() dto: MobileContactDto) {
    return this.contactService.addOrUpdateContact(dto)
  }

  @Get('getContacts')
  @Public()
  @ApiOperation({ summary: '获取联系人列表' })
  getContacts(@Query('userUuid') userUuid: string) {
    return this.contactService.getContacts(userUuid)
  }

  @Delete('deleteContact/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除联系人' })
  deleteContact(@Param('id') id: string) {
    return this.contactService.deleteContact(Number(id))
  }
}
