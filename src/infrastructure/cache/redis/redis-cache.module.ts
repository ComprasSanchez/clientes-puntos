// src/infrastructure/cache/redis/redis-cache.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';

@Global() // Así puedes inyectarlo en toda la app sin volver a importar el módulo
@Module({
  imports: [ConfigModule], // Importa config para poder inyectar ConfigService
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
