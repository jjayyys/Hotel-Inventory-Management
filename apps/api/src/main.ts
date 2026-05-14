import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_API_BASE_URL
      ? [process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')]
      : true,
    credentials: true,
  });
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
bootstrap();
