import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join } from 'path'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)
  const apiPrefix = config.get<string>('API_PREFIX', 'saas/api')
  const normalizedApiPrefix = apiPrefix.replace(/^\/+|\/+$/g, '')

  app.setGlobalPrefix(apiPrefix)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: `/${normalizedApiPrefix}/uploads/`
  })
  app.enableCors({
    origin: config.get<string>('FRONTEND_ORIGIN', 'http://localhost:5173'),
    credentials: true
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )
  app.useGlobalInterceptors(new RequestLoggerInterceptor(), new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS API')
    .setDescription('NestJS API for saas-web')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document)

  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0')
}

bootstrap()
