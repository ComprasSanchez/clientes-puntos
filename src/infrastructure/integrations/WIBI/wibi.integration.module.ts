import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ClienteEntity } from '@cliente/infrastructure/entities/ClienteEntity';
import { CategoriaEntity } from '@cliente/infrastructure/entities/CategoriaEntity';
import { OperacionEntity } from '@puntos/infrastructure/entities/operacion.entity';
import { LoteEntity } from '@puntos/infrastructure/entities/lote.entity';
import { WibiSyncController } from './controller/wibi-sync.controller';
import { WibiSyncService } from './services/wibi-sync.service';
import { WibiSyncCron } from './cron/wibi-sync.cron';

@Module({
  imports: [
    ClienteInfrastructureModule,
    PuntosInfrastructureModule,
    TypeOrmModule.forFeature([
      ClienteEntity,
      CategoriaEntity,
      OperacionEntity,
      LoteEntity,
    ]),
  ],
  controllers: [WibiSyncController],
  providers: [WibiSyncService, WibiSyncCron],
  exports: [WibiSyncService, WibiSyncCron],
})
export class WibiIntegrationModule {}
