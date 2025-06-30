import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaInfrastructureModule } from './context/Regla/infrastructure/regla.module';
import { PuntosInfrastructureModule } from './context/Puntos/infrastructure/puntos.module';

@Module({
  imports: [
    ClienteInfrastructureModule,
    ReglaInfrastructureModule,
    PuntosInfrastructureModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
