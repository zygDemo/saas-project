import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { QueueJobResponseDto } from './dto/queue.dto'

@Injectable()
export class QueueService {
  constructor(@InjectQueue('maintenance') private readonly maintenanceQueue: Queue) {}

  async enqueueHealthCheck(): Promise<QueueJobResponseDto> {
    const job = await this.maintenanceQueue.add(
      'health-check',
      { requestedAt: new Date().toISOString() },
      { removeOnComplete: 50, removeOnFail: 100 }
    )

    return {
      id: String(job.id ?? ''),
      name: job.name
    }
  }
}
