import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { MaintenanceConsumer } from './maintenance.consumer'
import { QueueController } from './queue.controller'
import { QueueService } from './queue.service'

@Module({
  imports: [BullModule.registerQueue({ name: 'maintenance' })],
  controllers: [QueueController],
  providers: [QueueService, MaintenanceConsumer],
  exports: [QueueService]
})
export class QueueModule {}
