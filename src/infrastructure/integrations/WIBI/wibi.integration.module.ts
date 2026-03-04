import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ClienteEntity } from '@cliente/infrastructure/entities/ClienteEntity';
import { OperacionEntity } from '@puntos/infrastructure/entities/operacion.entity';
import { LoteEntity } from '@puntos/infrastructure/entities/lote.entity';
import { WibiSyncController } from './controller/wibi-sync.controller';
import { WibiSyncService } from './services/wibi-sync.service';

@Module({
  imports: [
    ClienteInfrastructureModule,
    PuntosInfrastructureModule,
    TypeOrmModule.forFeature([ClienteEntity, OperacionEntity, LoteEntity]),
  ],
  controllers: [WibiSyncController],
  providers: [WibiSyncService],
  exports: [WibiSyncService],
})
export class WibiIntegrationModule {}
