import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

@Processor('maintenance')
export class MaintenanceConsumer extends WorkerHost {
  private readonly logger = new Logger(MaintenanceConsumer.name)

  async process(job: Job) {
    this.logger.log(`Processed ${job.name} job ${job.id}`)
    return { ok: true, data: job.data }
  }
}
