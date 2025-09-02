import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mergeOnzeInto } from '@infrastructure/integrations/PLEX/docs/onzecrm.openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

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

  // Swagger ESPECÍFICO de ONZE (doc separada, sin tocar controller)
  const cfgOnze = new DocumentBuilder()
    .setTitle('OnzeCRM Integration')
    .setDescription('Endpoint XML multipropósito vía CodAccion')
    .setVersion('1.0.0')
    .addBearerAuth() // o quitá si el endpoint /onzecrm va público
    .build();

  // base vacío o con módulos mínimos; acá usamos base “vacío” y luego fusionamos el doc TS
  const docOnzeBase = SwaggerModule.createDocument(app, cfgOnze, {
    deepScanRoutes: false, // no escanear decoradores; tomamos todo del doc externo
    include: [], // opcional; no incluimos módulos para mantenerlo limpio
  });

  const docOnze = mergeOnzeInto(docOnzeBase);
  SwaggerModule.setup('/onze/docs', app, docOnze);

  // Body RAW SOLO para XML en /onzecrm
  app.use('/onzecrm', express.raw({ type: 'application/xml' }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
