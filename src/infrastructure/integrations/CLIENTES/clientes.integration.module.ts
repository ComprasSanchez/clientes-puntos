// points/src/infrastructure/integrations/CLIENTES/clientes-integration.module.ts
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { Module, forwardRef } from '@nestjs/common';
import { ClientesExportController } from './controller/clientes-export.controller';
import { ClientesExportService } from './services/ClientesExportService';

@Module({
  imports: [
    forwardRef(() => ClienteInfrastructureModule), // para obtener ClienteRepository
  ],
  controllers: [ClientesExportController],
  providers: [ClientesExportService],
  exports: [ClientesExportService],
})
export class ClientesIntegrationModule {}
