// src/context/Puntos/infrastructure/PuntosInfrastructureModule.ts
import { Module, Provider } from '@nestjs/common';
import { TransaccionFactory } from '../core/factories/TransaccionFactory';
import { SaldoHandler } from '../core/services/SaldoHandler';
import { CreateOperacionService } from '../application/services/CreateOperacionService';
import { CompraUseCase } from '../application/use-cases/Compra/Compra';
import { ReglaInfrastructureModule } from 'src/context/Regla/infrastructure/regla.module';
import { LOTE_REPO, REGLA_ENGINE, TX_REPO } from './tokens/tokens';

const providers: Provider[] = [
  // repos de Puntos

  // auxiliares
  TransaccionFactory,
  SaldoHandler,

  // servicio de aplicación
  {
    provide: CreateOperacionService,
    useFactory: (loteRepo, txRepo, reglaEngine, txFactory, saldoHandler) =>
      new CreateOperacionService(
        loteRepo,
        txRepo,
        reglaEngine,
        txFactory,
        saldoHandler,
      ),
    inject: [
      LOTE_REPO,
      TX_REPO,
      REGLA_ENGINE,
      TransaccionFactory,
      SaldoHandler,
    ],
  },

  // caso de uso
  {
    provide: CompraUseCase,
    useFactory: (svc: CreateOperacionService) => new CompraUseCase(svc),
    inject: [CreateOperacionService],
  },
];

@Module({
  imports: [ReglaInfrastructureModule], // trae el provider REGLA_ENGINE
  providers,
  exports: [CompraUseCase],
})
export class PuntosInfrastructureModule {}
