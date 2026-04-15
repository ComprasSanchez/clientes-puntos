import { Injectable, Logger } from '@nestjs/common';
import { ClientesFsaClient } from './clientes-fsa.client';

export type SyncFromPuntosPayload = {
  plexId?: string | null;
  puntosId: string;
  dni?: string | null;
};

@Injectable()
export class ClientesSyncFromPuntosService {
  private readonly logger = new Logger(ClientesSyncFromPuntosService.name);
  constructor(private readonly clientesClient: ClientesFsaClient) {}

  async notifyClienteFidelizado(payload: SyncFromPuntosPayload): Promise<void> {
    try {
      this.logger.log(
        { payload },
        'Sending sync-from-puntos notification to Clientes MS',
      );

      await this.clientesClient.syncFromPuntos({
        puntosId: payload.puntosId,
        dni: payload.dni ?? '',
      });

      this.logger.log(
        {
          plexId: payload.plexId,
          puntosId: payload.puntosId,
        },
        'Sync-from-puntos notification sent successfully',
      );
    } catch (error) {
      // Importante: no romper la fidelizacion
      this.clientesClient.logAndIgnoreSyncError(error, payload);
    }
  }
}
