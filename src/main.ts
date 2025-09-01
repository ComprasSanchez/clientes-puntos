import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // 1) Prefijo global para todos los controladores
  app.setGlobalPrefix('api'); // => /api/cliente, /api/ajuste/acreditar, etc.

  // 2) CORS (un poco más permisivo con headers y OPTIONS)
  app.enableCors({
    origin: [
      'https://clientes-puntos-develop.up.railway.app',
      'http://clientes-puntos-develop.up.railway.app',
      // podés agregar localhost, etc.
      // /railway\.app$/  // si querés usar regex
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
  });

  // 3) Swagger en /api/docs (no pisa /api/*)
  const config = new DocumentBuilder()
    .setTitle('Puntos FSA - API Docs')
    .setDescription(
      'Documentación completa de la API de Sistema de Puntos de Sanchez Antoniolli',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4) Body raw SOLO para XML en el endpoint con prefijo global
  app.use('/api/onzecrm', express.raw({ type: 'application/xml' }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
