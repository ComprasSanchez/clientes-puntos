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
        extra: {
          max: cfg.get<number>('dbPoolMax') ?? 20,
          min: cfg.get<number>('dbPoolMin') ?? 2,
          idleTimeoutMillis: cfg.get<number>('dbPoolIdleMs') ?? 30000,
          connectionTimeoutMillis: cfg.get<number>('dbPoolAcquireMs') ?? 5000,
          statement_timeout: cfg.get<number>('dbStatementTimeoutMs') ?? 15000,
          query_timeout: cfg.get<number>('dbQueryTimeoutMs') ?? 15000,
          idle_in_transaction_session_timeout:
            cfg.get<number>('dbIdleInTxTimeoutMs') ?? 10000,
          lock_timeout: cfg.get<number>('dbLockTimeoutMs') ?? 3000,
        },
      }),
    }),
    TypeOrmModule.forFeature([IntegracionMovimientoEntity]),
  ],
  providers: [IntegracionMovimientoService],
  exports: [IntegracionMovimientoService],
})
export class DatabaseModule {}
