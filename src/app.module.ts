import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaInfrastructureModule } from './context/Regla/infrastructure/regla.module';
import { PuntosInfrastructureModule } from './context/Puntos/infrastructure/puntos.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { SharedModule } from '@shared/shared.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppExceptionFilter } from '@shared/core/exceptions/AppExceptionFilter';
import { KeycloakModule } from '@infrastructure/auth/keycloak.module';
import { AuthGuard, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';
import { IntegrationsModule } from '@infrastructure/integrations/integrations.module';
import { RedisCacheModule } from '@infrastructure/cache/redis/redis-cache.module';
import { RulesCacheModule } from '@infrastructure/cache/rules-cache/rules-cache.module';
import { MetricasModule } from './context/Metricas/infrastructure/metricas.module';

@Module({
  imports: [
    ConfigModule,
    KeycloakModule,
    SharedModule,
    RedisCacheModule,
    ClienteInfrastructureModule,
    ReglaInfrastructureModule,
    PuntosInfrastructureModule,
    IntegrationsModule,
    RulesCacheModule,
    MetricasModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 👈 Este es el guard base, obligatorio
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard, // 👈 Solo si usás @Resource y @Scopes (opcional)
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard, // 👈 Solo si usás @Roles (muy recomendable)
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
