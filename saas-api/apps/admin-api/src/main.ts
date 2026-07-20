import { Logger, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join, dirname } from 'path'
import * as fs from 'fs'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { PrismaService } from './modules/prisma/prisma.service'

function parseCorsOrigins(value?: string) {
  return String(value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isLocalEnvironment(value?: string) {
  const env = String(value || '')
    .trim()
    .toLowerCase()

  return env === 'development' || env === 'dev' || env === 'local' || env === 'localhost'
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)
  const apiPrefix = config.get<string>('API_PREFIX', 'saas/api')
  const normalizedApiPrefix = apiPrefix.replace(/^\/+|\/+$/g, '')
  const allowedOrigins = parseCorsOrigins(config.get<string>('FRONTEND_ORIGIN'))
  const nodeEnv = config.get<string>('NODE_ENV')
  const appEnv = config.get<string>('APP_ENV')
  const allowAllCors = isLocalEnvironment(nodeEnv) || isLocalEnvironment(appEnv)

  app.setGlobalPrefix(normalizedApiPrefix)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: `/${normalizedApiPrefix}/uploads/`,
  })
  // 生产环境启用完整 Helmet，开发环境关闭 CSP（避免阻止 HMR eval）
  const nodeEnv = config.get<string>('NODE_ENV', 'development')
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }))

  app.enableCors({
    origin: allowAllCors ? true : allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Org-Id']
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )
  app.useGlobalInterceptors(new RequestLoggerInterceptor(app.get(PrismaService)), new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)))

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS API')
    .setDescription('NestJS API for saas-web')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup(`${normalizedApiPrefix}/docs`, app, document, {
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelExpandDepth: 5,
      defaultModelsExpandDepth: 2
    }
  })


  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0')
}

bootstrap()