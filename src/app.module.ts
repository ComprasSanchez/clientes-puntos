import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaInfrastructureModule } from './context/Regla/infrastructure/regla.module';
import { PuntosInfrastructureModule } from './context/Puntos/infrastructure/puntos.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    ClienteInfrastructureModule,
    ReglaInfrastructureModule,
    PuntosInfrastructureModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
