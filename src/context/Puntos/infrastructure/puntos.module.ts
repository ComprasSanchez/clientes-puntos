// @puntos/infrastructure/PuntosInfrastructureModule.ts
import { forwardRef, Module } from '@nestjs/common';
import { CreateOperacionService } from '../application/services/CreateOperacionService';
import { CompraUseCase } from '../application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '../application/use-cases/Devolucion/Devolucion';
import { AnulacionUseCase } from '../application/use-cases/Anulacion/Anulacion';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import {
  CREATE_OPERACION_SERVICE,
  LOTE_FACTORY,
  OBTENER_SALDO_SERVICE,
  SALDO_HANDLER,
  TX_FACTORY,
} from '../core/tokens/tokens';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { PuntosPersistenceModule } from './persistence/persistence.module';
import { OperacionController } from './controllers/OperacionController';
import { TransaccionController } from './controllers/TransaccionController';
import { LoteController } from './controllers/LoteController';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { FindAllLotesUseCase } from '@puntos/application/use-cases/LoteFindAll/LoteFindAll';
import { FindLoteByIdUseCase } from '@puntos/application/use-cases/LoteFindById/LoteFindById';
import { FindLotesByClienteUseCase } from '@puntos/application/use-cases/LoteFindByCliente/LoteFindByCliente';
import { FindAllTransaccionesUseCase } from '@puntos/application/use-cases/TransaccionFindAll/TransaccionFindAll';
import { FindTransaccionByIdUseCase } from '@puntos/application/use-cases/TransaccionFindById/TransaccionFindById';
import { FindTransaccionesByClienteUseCase } from '@puntos/application/use-cases/TransaccionFindByCliente/TransaccionFindByCliente';
import { FindTransaccionesByLoteUseCase } from '@puntos/application/use-cases/TransaccionFindByLote/TransaccionFindByLote';
import { FindTransaccionesByOperationIdUseCase } from '@puntos/application/use-cases/TransaccionFindByOperacionId/TransaccionFindByOperacionId';
import { FindTransaccionesByReferenciaUseCase } from '@puntos/application/use-cases/TransaccionFindByReferencia/TransaccionFindByReferencia';
import { FindAllOperacionesUseCase } from '@puntos/application/use-cases/OperacionFindAll/OperacionFindAll';
import { FindOperacionByIdUseCase } from '@puntos/application/use-cases/OperacionFindById/OperacionFindById';
import { FindOperacionesByClienteUseCase } from '@puntos/application/use-cases/OperacionFindbyCliente/OperacionFindByCliente';
import { FindOperacionesByReferenciaUseCase } from '@puntos/application/use-cases/OperacionFindByReferencia/OperacionFindByReferencia';
import { IPUNTOS_SERVICE } from '@cliente/core/tokens/tokens';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory/PuntosServiceInMemory';
import { TransaccionFactory } from '@puntos/core/factories/TransaccionFactory';
import { SaldoHandler } from '@puntos/application/services/SaldoHandler';
import { LoteFactory } from '@puntos/core/factories/LoteFactory';
import { UUIDv4Generator } from '@shared/infrastructure/uuid/UuidV4Generator';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { AjusteController } from './controllers/AjusteController';
import { AjusteUseCase } from '@puntos/application/use-cases/Ajuste/Ajuste';

@Module({
  imports: [
    forwardRef(() => ReglaInfrastructureModule),
    DatabaseModule,
    PuntosPersistenceModule,
  ],
  controllers: [
    OperacionController,
    TransaccionController,
    LoteController,
    AjusteController,
  ],
  providers: [
    { provide: UUIDGenerator, useClass: UUIDv4Generator },
    // Factories y servicios auxiliares
    {
      provide: LOTE_FACTORY,
      useFactory: (idGen: UUIDGenerator) => new LoteFactory(idGen),
      inject: [UUIDGenerator],
    },

    {
      provide: TX_FACTORY,
      useFactory: (idGen: UUIDGenerator) => new TransaccionFactory(idGen),
      inject: [UUIDGenerator],
    },

    { provide: SALDO_HANDLER, useClass: SaldoHandler },

    // Servicio de aplicación y adapter de regla
    { provide: CREATE_OPERACION_SERVICE, useClass: CreateOperacionService },
    { provide: OBTENER_SALDO_SERVICE, useClass: ObtenerSaldo },

    {
      provide: IPUNTOS_SERVICE, // el token del puerto
      useClass: PuntosServiceInMemory, // la implementación
    },

    TransactionalRunner,

    // Casos de uso
    CompraUseCase,
    AjusteUseCase,
    DevolucionUseCase,
    AnulacionUseCase,
    FindAllLotesUseCase,
    FindLoteByIdUseCase,
    FindLotesByClienteUseCase,
    FindAllTransaccionesUseCase,
    FindTransaccionByIdUseCase,
    FindTransaccionesByClienteUseCase,
    FindTransaccionesByLoteUseCase,
    FindTransaccionesByOperationIdUseCase,
    FindTransaccionesByReferenciaUseCase,
    FindAllOperacionesUseCase,
    FindOperacionByIdUseCase,
    FindOperacionesByClienteUseCase,
    FindOperacionesByReferenciaUseCase,
  ],
  exports: [
    PuntosPersistenceModule,
    DatabaseModule,
    TransactionalRunner,
    CompraUseCase,
    DevolucionUseCase,
    AnulacionUseCase,
    OBTENER_SALDO_SERVICE,
    TX_FACTORY,
    SALDO_HANDLER,
    CREATE_OPERACION_SERVICE,
    IPUNTOS_SERVICE,
  ],
})
export class PuntosInfrastructureModule {}
