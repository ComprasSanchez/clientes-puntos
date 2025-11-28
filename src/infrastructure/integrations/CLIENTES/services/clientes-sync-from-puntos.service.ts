/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/infrastructure/integrations/clientes/clientes-sync-from-puntos.service.ts
import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDownstreamHttp } from '@sistemas-fsa/authz/nest';
import { CLIENTES_HTTP } from '../tokens/tokens';

export type SyncFromPuntosPayload = {
  plexId?: string | null;
  puntosId: string;
  dni?: string | null;
};

@Injectable()
export class ClientesSyncFromPuntosService {
  private readonly logger = new Logger(ClientesSyncFromPuntosService.name);
  @InjectDownstreamHttp(CLIENTES_HTTP)
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.CLIENTES_MS_BASE_URL;

    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async notifyClienteFidelizado(payload: SyncFromPuntosPayload): Promise<void> {
    try {
      this.logger.log(
        { payload },
        'Sending sync-from-puntos notification to Clientes MS',
      );

      await this.http.post('/clientes-sync/from-puntos', payload);

      this.logger.log(
        {
          plexId: payload.plexId,
          puntosId: payload.puntosId,
        },
        'Sync-from-puntos notification sent successfully',
      );
    } catch (error: any) {
      // ❗ Importante: NO romper la fidelización
      this.logger.error(
        {
          message: error?.message,
          code: error?.code,
          response: error?.response?.data,
          payload,
        },
        'Failed to notify Clientes MS from Puntos',
      );
    }
  }
}
