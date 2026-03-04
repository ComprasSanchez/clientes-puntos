import { Module } from '@nestjs/common';
import { PlexModule } from './PLEX/plex.module';
import { ClientesIntegrationModule } from './CLIENTES/clientes.integration.module';
import { WibiIntegrationModule } from './WIBI/wibi.integration.module';

@Module({
  imports: [PlexModule, ClientesIntegrationModule, WibiIntegrationModule],
  exports: [PlexModule, ClientesIntegrationModule, WibiIntegrationModule],
})
export class IntegrationsModule {}
