// points/src/infrastructure/integrations/CLIENTES/clientes-integration.module.ts
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';
import { Module, forwardRef } from '@nestjs/common';
import { ClientesExportController } from './controller/clientes-export.controller';
import { ClientesExportService } from './services/ClientesExportService';
import { ClientesFsaClient } from './services/clientes-fsa.client';
import { ClientesSyncFromPuntosService } from './services/clientes-sync-from-puntos.service';
import { PlexModule } from '../PLEX/plex.module';

@Module({
  imports: [
    forwardRef(() => ClienteInfrastructureModule), // para obtener ClienteRepository
    forwardRef(() => PlexModule),
  ],
  controllers: [ClientesExportController],
  providers: [
    ClientesExportService,
    ClientesFsaClient,
    ClientesSyncFromPuntosService,
  ],
  exports: [
    ClientesExportService,
    ClientesFsaClient,
    ClientesSyncFromPuntosService,
  ],
})
export class ClientesIntegrationModule {}
