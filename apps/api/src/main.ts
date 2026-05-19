import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_API_BASE_URL
      ? [process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')]
      : true,
    credentials: true,
  });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Food Waste API')
    .setDescription(
      'Core API surface for hotel inventory, waste tracking, and replenishment workflows.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
