import { forwardRef, Module } from '@nestjs/common';
import { FIDELIZAR_VENTA_ADAPTER } from './tokens/tokens';
import { FidelizarVentaPlexAdapter } from './use-cases/FidelizarVenta/adapters/fidelizar-venta.adapter';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { PlexController } from './plex.controller';

@Module({
  imports: [
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ClienteInfrastructureModule),
  ],
  controllers: [PlexController],
  providers: [
    {
      provide: FIDELIZAR_VENTA_ADAPTER,
      useClass: FidelizarVentaPlexAdapter,
    },
    TransactionalRunner,
  ],
  exports: [FIDELIZAR_VENTA_ADAPTER, TransactionalRunner],
})
export class PlexModule {}
