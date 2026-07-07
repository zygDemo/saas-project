import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { MsgTemplateController } from './msg-template.controller'
import { MsgTemplateService } from './msg-template.service'

@Module({
  imports: [PrismaModule],
  controllers: [MsgTemplateController],
  providers: [MsgTemplateService]
})
export class MsgTemplateModule {}
