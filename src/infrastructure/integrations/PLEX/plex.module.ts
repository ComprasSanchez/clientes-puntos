import { forwardRef, Module } from '@nestjs/common';
import {
  CONSULTAR_CLIENTE_ADAPTER,
  CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
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
import { DatabaseModule } from '@infrastructure/database/database.module';
import { ConsultarEstadisticasClientePlexAdapter } from './use-cases/ConsultarEstadisticasCliente/adapters/consultar-estadisticas-cliente.adapter';
import { MetricasModule } from 'src/context/Metricas/infrastructure/metricas.module';

@Module({
  imports: [
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ClienteInfrastructureModule),
    forwardRef(() => ReglaInfrastructureModule),
    forwardRef(() => MetricasModule),
    DatabaseModule,
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
    {
      provide: CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
      useClass: ConsultarEstadisticasClientePlexAdapter,
    },
    TransactionalRunner,
  ],
  exports: [
    FIDELIZAR_VENTA_ADAPTER,
    FIDELIZAR_CLIENTE_ADAPTER,
    CONSULTAR_CLIENTE_ADAPTER,
    CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
    TransactionalRunner,
  ],
})
export class PlexModule {}
