import { BullModule } from '@nestjs/bullmq'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { resolve } from 'path'
import { TenantMiddleware } from './common/tenant/tenant.middleware'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { MenusModule } from './modules/menus/menus.module'
import { DictModule } from './modules/dict/dict.module'
import { FileModule } from './modules/file/file.module'
import { OcrModule } from './modules/ocr/ocr.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { QueueModule } from './modules/queue/queue.module'
import { RedisModule } from './modules/redis/redis.module'
import { RolesModule } from './modules/roles/roles.module'
import { UsersModule } from './modules/users/users.module'

// 车贷 SaaS 业务模块
import { OrganizationModule } from './modules/org/org.module'
import { DeptModule } from './modules/dept/dept.module'
import { ProductModule } from './modules/product/product.module'
import { FunderModule } from './modules/funder/funder.module'
import { FlowConfigModule } from './modules/flow-config/flow-config.module'
import { LeadModule } from './modules/lead/lead.module'
import { CustomerModule } from './modules/customer/customer.module'
import { ApplicationModule } from './modules/application/application.module'
import { ApprovalModule } from './modules/approval/approval.module'
import { SigningModule } from './modules/signing/signing.module'
import { DisbursementModule } from './modules/disbursement/disbursement.module'
import { RepaymentModule } from './modules/repayment/repayment.module'
import { MobileBusinessModule } from './modules/mobile-business/mobile-business.module'
import { DataCenterModule } from './modules/data-center/data-center.module'
import { ReadingModule } from './modules/reading/reading.module'
import { CrawlerModule } from './modules/crawler/crawler.module'
import { DbOpsModule } from './modules/db-ops/db-ops.module'
import { SystemParamModule } from './modules/system-param/system-param.module'
import { MobileConfigModule } from './modules/mobile-config/mobile-config.module'
import { AnnouncementModule } from './modules/announcement/announcement.module'
import { MsgTemplateModule } from './modules/msg-template/msg-template.module'

// 平台管理模块
import { PackagePlanModule } from './modules/package-plan/package-plan.module'
import { ProductTemplateModule } from './modules/product-template/product-template.module'
import { ThirdPartyServiceModule } from './modules/third-party-service/third-party-service.module'
import { WorkOrderModule } from './modules/work-order/work-order.module'
import { PlatformSupervisionModule } from './modules/platform-supervision/platform-supervision.module'

const appEnv = process.env.NODE_ENV || 'development'
const envFilePaths = [
  resolve(process.cwd(), 'env', `.env.${appEnv}`),
  resolve(process.cwd(), 'env', '.env'),
  resolve(process.cwd(), 'apps', 'admin-api', 'env', `.env.${appEnv}`),
  resolve(process.cwd(), 'apps', 'admin-api', 'env', '.env'),
  resolve(process.cwd(), 'saas-api', 'apps', 'admin-api', 'env', `.env.${appEnv}`),
  resolve(process.cwd(), 'saas-api', 'apps', 'admin-api', 'env', '.env')
]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined
        }
      })
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    DictModule,
    FileModule,
    OcrModule,
    HealthModule,
    // 业务模块
    OrganizationModule,
    DeptModule,
    ProductModule,
    FunderModule,
    FlowConfigModule,
    LeadModule,
    CustomerModule,
    ApplicationModule,
    ApprovalModule,
    SigningModule,
    DisbursementModule,
    RepaymentModule,
    MobileBusinessModule,
    DataCenterModule,
    ReadingModule,
    CrawlerModule,
    DbOpsModule,
    SystemParamModule,
    MobileConfigModule,
    AnnouncementModule,
    MsgTemplateModule,
    // 平台管理模块
    PackagePlanModule,
    ProductTemplateModule,
    ThirdPartyServiceModule,
    WorkOrderModule,
    PlatformSupervisionModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*')
  }
}
