import { Module } from '@nestjs/common';
import { PlexModule } from './PLEX/plex.module';
import { ClientesIntegrationModule } from './CLIENTES/clientes.integration.module';

@Module({
  imports: [PlexModule, ClientesIntegrationModule],
  exports: [PlexModule, ClientesIntegrationModule],
})
export class IntegrationsModule {}
