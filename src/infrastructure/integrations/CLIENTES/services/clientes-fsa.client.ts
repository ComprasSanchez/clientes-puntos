import { Injectable, Logger } from '@nestjs/common';
import { InjectDownstreamHttp } from '@sistemas-fsa/authz/nest';
import { AxiosError, AxiosInstance, isAxiosError } from 'axios';
import {
  ClientesFsaClienteDto,
  ClientesFsaClienteIdDto,
  ClientesFsaClientesBulkRequestDto,
  ClientesFsaClientesBulkResponseDto,
  ClientesFsaMeDto,
  ClientesFsaUpsertVerificacionRequest,
} from '../dto/clientes-fsa.dto';
import { CLIENTES_HTTP } from '../tokens/tokens';

@Injectable()
export class ClientesFsaClient {
  private readonly logger = new Logger(ClientesFsaClient.name);
  private readonly sensitiveHeaders = new Set([
    'authorization',
    'x-api-key',
    'cookie',
    'set-cookie',
  ]);

  constructor(
    @InjectDownstreamHttp(CLIENTES_HTTP)
    private readonly http: AxiosInstance,
  ) {}

  async findById(id: string): Promise<ClientesFsaClienteDto | null> {
    const path = `/clientes/${encodeURIComponent(id)}`;

    try {
      const response = await this.http.get<ClientesFsaClienteDto>(path);
      return response.data;
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      this.logDownstreamError('findById', error, { path, id });
      throw error;
    }
  }

  async findMe(): Promise<ClientesFsaMeDto | null> {
    const path = '/clientes/me';

    try {
      const response = await this.http.get<ClientesFsaMeDto>(path);
      return response.data;
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      this.logDownstreamError('findMe', error, { path });
      throw error;
    }
  }

  async findByExternalId(
    sistema: string,
    extId: string,
  ): Promise<ClientesFsaClienteDto | null> {
    const path = `/clientes/external/${encodeURIComponent(sistema)}/${encodeURIComponent(extId)}`;

    try {
      const response = await this.http.get<ClientesFsaClienteDto>(path);
      return response.data;
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      this.logDownstreamError('findByExternalId', error, {
        path,
        sistema,
      });
      throw error;
    }
  }

  async findByDni(dni: string): Promise<ClientesFsaClienteDto | null> {
    const normalizedDni = this.normalizeDni(dni);
    const path = `/clientes/doc/DNI/${encodeURIComponent(normalizedDni)}`;

    try {
      const response = await this.http.get<ClientesFsaClienteDto>(path);
      return response.data;
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      this.logDownstreamError('findByDni', error, {
        path,
        dniLast4: dni.slice(-4),
      });
      throw error;
    }
  }

  async findManyByDni(dnis: string[]): Promise<Map<string, ClientesFsaClienteDto>> {
    const documentos = Array.from(
      new Set(
        dnis
          .map((dni) => this.normalizeDni(dni))
          .map((dni) => dni.trim())
          .filter((dni) => dni.length > 0),
      ),
    );

    if (!documentos.length) {
      return new Map();
    }

    const path = '/clientes/doc/DNI/bulk';
    const payload: ClientesFsaClientesBulkRequestDto = {
      documentos,
    };

    try {
      const response =
        await this.http.post<ClientesFsaClientesBulkResponseDto>(path, payload);

      const map = new Map<string, ClientesFsaClienteDto>();

      for (const item of response.data?.items ?? []) {
        const numero = String(item.documento?.numero ?? '').trim();
        const normalized = this.normalizeDni(numero);
        if (!normalized) continue;

        map.set(normalized, item);
      }

      return map;
    } catch (error) {
      this.logDownstreamError('findManyByDni', error, {
        path,
        requested: documentos.length,
      });
      throw error;
    }
  }

  async findProfileById(id: string): Promise<ClientesFsaClienteDto | null> {
    const path = `/clientes/${encodeURIComponent(id)}/profile`;

    try {
      const response = await this.http.get<ClientesFsaClienteDto>(path);
      return response.data;
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      this.logDownstreamError('findProfileById', error, { path, id });
      throw error;
    }
  }

  async upsertVerificacion(
    payload: ClientesFsaUpsertVerificacionRequest,
  ): Promise<ClientesFsaClienteIdDto> {
    const path = '/clientes/verificacion/upsert';

    try {
      const response = await this.http.post<ClientesFsaClienteIdDto>(
        path,
        payload,
      );

      return response.data;
    } catch (error) {
      this.logDownstreamError('upsertVerificacion', error, {
        path,
        documentoNumeroLast4: payload.nroDocumento?.slice(-4),
      });
      throw error;
    }
  }

  async syncFromPuntos(payload: {
    puntosId: string;
    dni: string;
  }): Promise<void> {
    const path = '/clientes-sync/from-puntos';

    try {
      await this.http.post(path, payload);
    } catch (error) {
      this.logDownstreamError('syncFromPuntos', error, {
        path,
        puntosId: payload.puntosId,
        dniLast4: payload.dni?.slice(-4),
      });
      throw error;
    }
  }

  private isNotFound(error: unknown): boolean {
    if (!isAxiosError(error)) return false;
    return (error as AxiosError).response?.status === 404;
  }

  logAndIgnoreSyncError(
    error: unknown,
    payload: { puntosId: string; dni?: string | null },
  ): void {
    const axiosError = isAxiosError(error) ? (error as AxiosError) : null;

    const details = {
      message: axiosError?.message ?? String(error),
      code: axiosError?.code,
      status: axiosError?.response?.status,
      response: axiosError?.response?.data,
      payload,
    };

    this.logger.error(
      `Failed to notify Clientes MS from Puntos ${this.safeJson(details)}`,
    );
  }

  private logDownstreamError(
    operation: string,
    error: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const axiosError = isAxiosError(error) ? (error as AxiosError) : null;
    const config = axiosError?.config;
    const requestHeaders = this.sanitizeHeaders(config?.headers);

    const details = {
      operation,
      message: axiosError?.message ?? String(error),
      code: axiosError?.code,
      method: config?.method,
      baseURL: config?.baseURL,
      url: config?.url,
      requestHeaders,
      status: axiosError?.response?.status,
      statusText: axiosError?.response?.statusText,
      responseData: axiosError?.response?.data,
      ...metadata,
    };

    this.logger.error(
      `Downstream Clientes request failed ${this.safeJson(details)}`,
    );
  }

  private safeJson(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable-error-details]';
    }
  }

  private sanitizeHeaders(
    headers: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!headers) return undefined;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (this.sensitiveHeaders.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private normalizeDni(dni: string): string {
    const trimmed = String(dni).trim();
    const noLeadingZeros = trimmed.replace(/^0+/, '');
    return noLeadingZeros.length > 0 ? noLeadingZeros : trimmed;
  }
}
