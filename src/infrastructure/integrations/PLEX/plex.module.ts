import { forwardRef, Module } from '@nestjs/common';
import {
  CONSULTAR_CLIENTE_ADAPTER,
  FIDELIZAR_CLIENTE_ADAPTER,
  FIDELIZAR_VENTA_ADAPTER,
} from './tokens/tokens';
import { FidelizarVentaPlexAdapter } from './use-cases/FidelizarVenta/adapters/fidelizar-venta.adapter';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { PlexController } from './plex.controller';
import { FidelizarClientePlexAdapter } from './use-cases/FidelizarCliente/adapters/fidelizar-cliente.adapter';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import { ConsultarClientePlexAdapter } from './use-cases/ConsultarCliente/adapters/consultar-cliente.adapter';

@Module({
  imports: [
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ClienteInfrastructureModule),
    forwardRef(() => ReglaInfrastructureModule),
  ],
  controllers: [PlexController],
  providers: [
    {
      provide: FIDELIZAR_VENTA_ADAPTER,
      useClass: FidelizarVentaPlexAdapter,
    },
    {
      provide: FIDELIZAR_CLIENTE_ADAPTER,
      useClass: FidelizarClientePlexAdapter,
    },
    {
      provide: CONSULTAR_CLIENTE_ADAPTER,
      useClass: ConsultarClientePlexAdapter,
    },
    TransactionalRunner,
  ],
  exports: [
    FIDELIZAR_VENTA_ADAPTER,
    FIDELIZAR_CLIENTE_ADAPTER,
    CONSULTAR_CLIENTE_ADAPTER,
    TransactionalRunner,
  ],
})
export class PlexModule {}
