import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development and production
  app.enableCors({
    origin: [
      'http://localhost:3333',
      'https://*.vercel.app',
      'https://supaspend.vercel.app', // Your main domain
      process.env.FRONTEND_URL,
    ].filter((url): url is string => Boolean(url)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('SupaSpend API')
    .setDescription('API documentation for SupaSpend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 4444;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Railway

  const environment = process.env.NODE_ENV || 'development';
  console.log(`🚀 API Server running on port ${port} (${environment})`);
  console.log(`📡 Health check available at http://localhost:${port}/health`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/api-docs`);
}

void bootstrap();
