import { forwardRef, Module } from '@nestjs/common';
import {
  CONSULTAR_CLIENTE_ADAPTER,
  CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
  CONSULTAR_NOVEDADES_CLIENTE_ADAPTER,
  FIDELIZAR_CLIENTE_ADAPTER,
  FIDELIZAR_PRODUCTO_ADAPTER,
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
import { JwtGuard } from '@infrastructure/auth/jwt.guard';
import { FidelizarProductoPlexAdapter } from './use-cases/FidelizarProducto/adapters/fidelizar-producto.adapter';
import { ProductoModule } from 'src/context/Producto/infrastructure/producto.module';
import { ClientesIntegrationModule } from '../CLIENTES/clientes.integration.module';
import { ConsultarNovedadesClientePlexAdapter } from './use-cases/ConsultarNovedadesCliente/adapters/consultar-novedades-cliente.adapter';
import { SociosaController } from './sociosa.controller';

@Module({
  imports: [
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ClienteInfrastructureModule),
    forwardRef(() => ClientesIntegrationModule),
    forwardRef(() => ReglaInfrastructureModule),
    forwardRef(() => MetricasModule),
    forwardRef(() => ProductoModule),
    DatabaseModule,
  ],
  controllers: [PlexController, SociosaController],
  providers: [
    JwtGuard,
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
    {
      provide: FIDELIZAR_PRODUCTO_ADAPTER,
      useClass: FidelizarProductoPlexAdapter,
    },
    {
      provide: CONSULTAR_NOVEDADES_CLIENTE_ADAPTER,
      useClass: ConsultarNovedadesClientePlexAdapter,
    },
    TransactionalRunner,
  ],
  exports: [
    FIDELIZAR_VENTA_ADAPTER,
    FIDELIZAR_CLIENTE_ADAPTER,
    CONSULTAR_CLIENTE_ADAPTER,
    FIDELIZAR_PRODUCTO_ADAPTER,
    CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
    CONSULTAR_NOVEDADES_CLIENTE_ADAPTER,
    TransactionalRunner,
  ],
})
export class PlexModule {}
