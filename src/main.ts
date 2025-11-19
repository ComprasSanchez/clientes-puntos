/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { buildOnzeDoc } from '@infrastructure/integrations/PLEX/docs/onzecrm.openapi';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'https://clientes-puntos-develop.up.railway.app',
      'http://clientes-puntos-develop.up.railway.app',
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

  // Swagger GENERAL
  const cfgGeneral = new DocumentBuilder()
    .setTitle('Puntos FSA - API Docs')
    .setDescription('Documentación completa de la API de Sistema de Puntos')
    .setVersion('1.0')
    .addBearerAuth() // quitalo si no querés mostrar auth en este portal
    .build();

  const docGeneral = SwaggerModule.createDocument(app, cfgGeneral);
  SwaggerModule.setup('/docs', app, docGeneral);

  const cfgOnze = new DocumentBuilder()
    .setTitle('OnzeCRM Integration')
    .setDescription('Endpoint XML multipropósito vía CodAccion')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const docOnzeBase = SwaggerModule.createDocument(app, cfgOnze, {
    deepScanRoutes: false,
    include: [],
  });

  const docOnze = buildOnzeDoc(docOnzeBase);
  SwaggerModule.setup('/onze/docs', app, docOnze);

  // === NUEVO: endpoints JSON para ambos
  const http = app.getHttpAdapter();
  http.get('/docs-json', (_req: any, res: any) => res.json(docGeneral));
  http.get('/onze/docs-json', (_req: any, res: any) => res.json(docOnze));

  // Body RAW SOLO para XML en /onzecrm
  app.use('/onzecrm', express.raw({ type: 'application/xml' }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
