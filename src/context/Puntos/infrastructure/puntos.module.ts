// src/context/Puntos/infrastructure/PuntosInfrastructureModule.ts
import { forwardRef, Module, Provider } from '@nestjs/common';
import { TransaccionFactory } from '../core/factories/TransaccionFactory';
import { SaldoHandler } from '../core/services/SaldoHandler';
import { CreateOperacionService } from '../application/services/CreateOperacionService';
import { CompraUseCase } from '../application/use-cases/Compra/Compra';
import { ReglaInfrastructureModule } from 'src/context/Regla/infrastructure/regla.module';
import { LOTE_REPO, TX_REPO, REGLA_ENGINE } from './tokens/tokens';
import { LoteRepository } from '../core/repository/LoteRepository';
import { TransaccionRepository } from '../core/repository/TransaccionRepository';
import { RuleEngineContract } from 'src/context/Regla/application/dtos/RuleEngineContract';
import { DevolucionUseCase } from '../application/use-cases/Devolucion/Devolucion';
import { AnulacionUseCase } from '../application/use-cases/Anulacion/Anulacion';
import { TypeOrmLoteRepository } from './persistence/LoteRepository/LoteTypeOrmImpl';
import { TypeOrmTransaccionRepository } from './persistence/TransaccionRepository/TransaccionTypeOrmImpl';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoteEntity } from './entities/lote.entity';
import { TransaccionEntity } from './entities/transaccion.entity';

const providers: Provider[] = [
  // 1) Repositorios de Puntos
  { provide: LOTE_REPO, useClass: TypeOrmLoteRepository },
  { provide: TX_REPO, useClass: TypeOrmTransaccionRepository },

  // 2) Auxiliares
  TransaccionFactory,
  SaldoHandler,

  // 3) Servicio de aplicación que recibe el adapter via REGLA_ENGINE
  {
    provide: CreateOperacionService,
    useFactory: (
      loteRepo: LoteRepository,
      txRepo: TransaccionRepository,
      reglaEngine: RuleEngineContract,
      txFactory: TransaccionFactory,
      saldoHandler: SaldoHandler,
    ): CreateOperacionService => {
      return new CreateOperacionService(
        loteRepo,
        txRepo,
        reglaEngine, // aquí va el adapter que implementa ReglaEngine
        txFactory,
        saldoHandler,
      );
    },
    inject: [
      LOTE_REPO,
      TX_REPO,
      REGLA_ENGINE, // inyecta el adapter desde ReglaInfrastructureModule
      TransaccionFactory,
      SaldoHandler,
    ],
  },

  // 4) Caso de uso de Puntos
  {
    provide: CompraUseCase,
    useFactory: (svc: CreateOperacionService) => new CompraUseCase(svc),
    inject: [CreateOperacionService],
  },
  {
    provide: DevolucionUseCase,
    useFactory: (svc: CreateOperacionService) => new CompraUseCase(svc),
    inject: [CreateOperacionService],
  },
  {
    provide: AnulacionUseCase,
    useFactory: (svc: CreateOperacionService) => new CompraUseCase(svc),
    inject: [CreateOperacionService],
  },
];

@Module({
  imports: [
    forwardRef(() => ReglaInfrastructureModule),
    TypeOrmModule.forFeature([LoteEntity]),
    TypeOrmModule.forFeature([TransaccionEntity]),
  ],
  providers,
  exports: [CompraUseCase, DevolucionUseCase, AnulacionUseCase],
})
export class PuntosInfrastructureModule {}
