import { NestFactory } from '@nestjs/core';

// Polyfill de Web Crypto API en Node 18
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
