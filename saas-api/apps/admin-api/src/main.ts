import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const apiPrefix = config.get<string>('API_PREFIX', 'saas/api')

  app.setGlobalPrefix(apiPrefix)
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

  await app.listen(config.get<number>('PORT', 3000))
}

bootstrap()
