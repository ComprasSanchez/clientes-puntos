import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaInfrastructureModule } from './context/Regla/infrastructure/regla.module';
import { PuntosInfrastructureModule } from './context/Puntos/infrastructure/puntos.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { SharedModule } from '@shared/shared.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppExceptionFilter } from '@shared/core/exceptions/AppExceptionFilter';
import { KeycloakModule } from '@infrastructure/auth/keycloak.module';
import { AuthGuard } from 'nest-keycloak-connect';
import { IntegrationsModule } from '@infrastructure/integrations/integrations.module';
import { RedisCacheModule } from '@infrastructure/cache/redis/redis-cache.module';
import { RulesCacheModule } from '@infrastructure/cache/rules-cache/rules-cache.module';
import { MetricasModule } from './context/Metricas/infrastructure/metricas.module';
import { MetricasQueueModule } from './context/Metricas/infrastructure/MetricasQueue/metricas-queue.module';
import { SaldoCacheModule } from '@infrastructure/cache/saldo-cache/saldo-cache.module';
import { SucursalInfrastructureModule } from './context/Sucursal/infrastructure/sucursal.module';
import { ProductoModule } from './context/Producto/infrastructure/producto.module';
import { AuthzModule } from '@infrastructure/auth/V2/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthzModule,
    KeycloakModule,
    SharedModule,
    RedisCacheModule,
    ClienteInfrastructureModule,
    ReglaInfrastructureModule,
    PuntosInfrastructureModule,
    SucursalInfrastructureModule,
    IntegrationsModule,
    RulesCacheModule,
    SaldoCacheModule,
    MetricasModule,
    MetricasQueueModule,
    ProductoModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 👈 Este es el guard base, obligatorio
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
