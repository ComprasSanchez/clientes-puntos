// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
