// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://clientes-puntos-develop.up.railway.app',
      'http://clientes-puntos-develop.up.railway.app',
    ], // O un array: ['https://midominio.com', 'http://localhost:3000']
    credentials: true, // si usas cookies/sesiones
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  });

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Puntos FSA - API Docs')
    .setDescription(
      'Documentación completa de la API de Sistema de Puntos de Sanchez Antoniolli',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use('/onzecrm', express.raw({ type: 'application/xml' }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
