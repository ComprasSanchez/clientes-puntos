// src/main.ts
import { NestFactory } from '@nestjs/core';
import { webcrypto } from 'crypto';
import { AppModule } from './app.module';

// 1) Definimos la forma de globalThis que incluye optional crypto
interface GlobalWithCrypto {
  crypto?: Crypto;
}

// 2) Hacemos un alias tipado (sin usar any)
const g = globalThis as unknown as GlobalWithCrypto;

// 3) Si no existe, lo inicializamos con un doble-cast
if (!g.crypto) {
  g.crypto = webcrypto as unknown as Crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al levantar la app', err);
  process.exit(1);
});
