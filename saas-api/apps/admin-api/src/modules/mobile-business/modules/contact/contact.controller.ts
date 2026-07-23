import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { MobileContactDto } from '../../dto/mobile-business.dto'
import { MobileContactService } from '../../mobile-contact.service'

@ApiTags('移动端联系人')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/contact')
export class MobileContactController {
  constructor(private readonly contactService: MobileContactService) {}

  @Post('addOrUpdateContact')
  @ApiOperation({ summary: '新增/更新联系人' })
  addOrUpdateContact(@Body() dto: MobileContactDto) {
    return this.contactService.addOrUpdateContact(dto)
  }

  @Get('getContacts')
  @ApiOperation({ summary: '获取联系人列表' })
  getContacts(@Query('userUuid') userUuid: string) {
    return this.contactService.getContacts(userUuid)
  }

  @Delete('deleteContact/:id')
  @ApiOperation({ summary: '删除联系人' })
  deleteContact(@Param('id') id: string) {
    return this.contactService.deleteContact(Number(id))
  }
}
