import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (suppressed):', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (suppressed):', err);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Crypto Screener API')
    .setDescription('Production-grade crypto screener backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  // NestJS listens on internal port 4001 (not exposed externally in production)
  const nestPort = process.env.NODE_ENV === 'production' ? 4001 : parseInt(process.env.PORT || '4000', 10);
  await app.listen(nestPort);

  if (process.env.NODE_ENV === 'production') {
    console.log(`API server on internal port ${nestPort}`);
  } else {
    console.log(`Crypto Screener running on port ${nestPort}`);
    console.log(`API: http://localhost:${nestPort}/api`);
    console.log(`Docs: http://localhost:${nestPort}/docs`);
    console.log(`Health: http://localhost:${nestPort}/health`);
  }
}

bootstrap();
