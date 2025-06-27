import { Module } from '@nestjs/common';
import { ClienteInfrastructureModule } from './context/Cliente/infrastructure/cliente.module';
import { ReglaEngineInfrastructureModule } from './context/Regla/infrastructure/regla.module';

@Module({
  imports: [ClienteInfrastructureModule, ReglaEngineInfrastructureModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
