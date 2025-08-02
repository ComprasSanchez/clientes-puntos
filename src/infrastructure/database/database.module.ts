// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '../config/config.module';
import { IntegracionMovimientoEntity } from './entities/integracion-movimiento.entity';
import { IntegracionMovimientoService } from './services/IntegracionMovimientoService';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // tu módulo de @nestjs/config
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('dbHost'),
        port: cfg.get<number>('dbPort'),
        username: cfg.get<string>('dbUser'),
        password: cfg.get<string>('dbPass'),
        database: cfg.get<string>('dbName'),
        autoLoadEntities: true,
        synchronize: cfg.get<string>('nodeEnv') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([IntegracionMovimientoEntity]),
  ],
  providers: [IntegracionMovimientoService],
  exports: [IntegracionMovimientoService],
})
export class DatabaseModule {}
