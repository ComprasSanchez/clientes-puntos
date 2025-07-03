// @puntos/infrastructure/persistence/persistence.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionEntity } from '../entities/transaccion.entity';
import { TypeOrmTransaccionRepository } from './TransaccionRepository/TransaccionTypeOrmImpl';
import { LoteEntity } from '../entities/lote.entity';
import { TypeOrmLoteRepository } from './LoteRepository/LoteTypeOrmImpl';
import { LOTE_REPO, OPERACION_REPO, TX_REPO } from '@puntos/core/tokens/tokens';
import { TypeOrmOperacionRepository } from './OperacionRepository/OperacionTypeOrmImpl';
import { OperacionEntity } from '../entities/operacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransaccionEntity, LoteEntity, OperacionEntity]),
  ],
  providers: [
    {
      provide: TX_REPO, // el token que usa tu capa de aplicación
      useClass: TypeOrmTransaccionRepository, // tu implementación concreta
    },
    {
      provide: OPERACION_REPO,
      useClass: TypeOrmOperacionRepository,
    },
    {
      provide: LOTE_REPO, // el token que usa tu capa de aplicación
      useClass: TypeOrmLoteRepository, // tu implementación concreta
    },
  ],
  exports: [TX_REPO, LOTE_REPO, OPERACION_REPO], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class PuntosPersistenceModule {}
