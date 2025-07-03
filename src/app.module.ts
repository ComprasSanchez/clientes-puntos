import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaInfrastructureModule } from './context/Regla/infrastructure/regla.module';
import { PuntosInfrastructureModule } from './context/Puntos/infrastructure/puntos.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { SharedModule } from '@shared/shared.module';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from '@shared/core/exceptions/AppExceptionFilter';

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    ClienteInfrastructureModule,
    ReglaInfrastructureModule,
    PuntosInfrastructureModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
