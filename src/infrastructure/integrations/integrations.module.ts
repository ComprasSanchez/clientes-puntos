import { Module } from '@nestjs/common';
import { PlexModule } from './PLEX/plex.module';

@Module({
  imports: [PlexModule],
  exports: [PlexModule],
})
export class IntegrationsModule {}
