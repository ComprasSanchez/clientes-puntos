// @puntos/infrastructure/PuntosInfrastructureModule.ts
import { forwardRef, Module } from '@nestjs/common';
import { TransaccionFactory } from '../core/factories/TransaccionFactory';
import { SaldoHandler } from '../core/services/SaldoHandler';
import { CreateOperacionService } from '../application/services/CreateOperacionService';
import { CompraUseCase } from '../application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '../application/use-cases/Devolucion/Devolucion';
import { AnulacionUseCase } from '../application/use-cases/Anulacion/Anulacion';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import {
  CREATE_OPERACION_SERVICE,
  SALDO_HANDLER,
  TX_FACTORY,
} from '../core/tokens/tokens';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoteEntity } from './entities/lote.entity';
import { TransaccionEntity } from './entities/transaccion.entity';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { PuntosPersistenceModule } from './persistence/persistence.module';
import { OperacionEntity } from './entities/operacion.entity';

@Module({
  imports: [
    forwardRef(() => ReglaInfrastructureModule),
    TypeOrmModule.forFeature([LoteEntity, TransaccionEntity, OperacionEntity]),
    DatabaseModule,
    PuntosPersistenceModule,
  ],
  providers: [
    // Factories y servicios auxiliares
    { provide: TX_FACTORY, useClass: TransaccionFactory },
    { provide: SALDO_HANDLER, useClass: SaldoHandler },

    // Servicio de aplicación y adapter de regla
    { provide: CREATE_OPERACION_SERVICE, useClass: CreateOperacionService },

    // Casos de uso
    CompraUseCase,
    DevolucionUseCase,
    AnulacionUseCase,
  ],
  exports: [CompraUseCase, DevolucionUseCase, AnulacionUseCase],
})
export class PuntosInfrastructureModule {}
