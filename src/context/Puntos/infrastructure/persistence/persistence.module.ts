// @puntos/infrastructure/persistence/persistence.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionEntity } from '../entities/transaccion.entity';
import { TypeOrmTransaccionRepository } from './TransaccionRepository/TransaccionTypeOrmImpl';
import { LoteEntity } from '../entities/lote.entity';
import { TypeOrmLoteRepository } from './LoteRepository/LoteTypeOrmImpl';
import {
  AJUSTE_REPO,
  LOTE_REPO,
  OPERACION_REPO,
  SALDO_REPO,
  TX_REPO,
} from '@puntos/core/tokens/tokens';
import { TypeOrmOperacionRepository } from './OperacionRepository/OperacionTypeOrmImpl';
import { OperacionEntity } from '../entities/operacion.entity';
import { SaldoCliente } from '../entities/saldo.entity';
import { HistorialSaldoCliente } from '../entities/historial-saldo.entity';
import { TypeOrmSaldoRepository } from './SaldoRepository/SaldoTypeOrmImpl';
import { AjusteEntity } from '../entities/ajuste.entity';
import { AjusteTypeOrmRepository } from './AjusteRepository/TypeOrmAjusteImpl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransaccionEntity,
      LoteEntity,
      OperacionEntity,
      SaldoCliente,
      HistorialSaldoCliente,
      AjusteEntity,
    ]),
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
    {
      provide: SALDO_REPO, // <-- AGREGA TU TOKEN Y REPO
      useClass: TypeOrmSaldoRepository,
    },
    {
      provide: AJUSTE_REPO,
      useClass: AjusteTypeOrmRepository,
    },
  ],
  exports: [TX_REPO, LOTE_REPO, SALDO_REPO, OPERACION_REPO, AJUSTE_REPO], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class PuntosPersistenceModule {}
