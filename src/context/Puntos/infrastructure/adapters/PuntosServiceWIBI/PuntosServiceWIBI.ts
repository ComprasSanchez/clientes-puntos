import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as https from 'https';

const DEFAULT_WIBI_API_URL = 'https://api.wibi.com.ar/onzecrm';
const DEFAULT_WIBI_TOKEN_URL = 'https://api.wibi.com.ar/onzecrm/token';

@Injectable()
export class PuntosServiceWIBI {
  private readonly logger = new Logger(PuntosServiceWIBI.name);
  private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

  private tokenCache: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private tokenInFlight: Promise<string | null> | null = null;

  async obtenerSaldoActualByTarjeta(nroTarjeta: string): Promise<number> {
    const cardNumber = String(nroTarjeta ?? '').trim();
    if (!cardNumber) {
      throw new Error('NroTarjeta requerido para consultar saldo WIBI');
    }

    const raw = await this.consultarClientePorTarjeta(cardNumber);
    const respCode = (extractXmlTag(raw, 'RespCode') ?? '').trim();
    const respMsg = (extractXmlTag(raw, 'RespMsg') ?? '').trim();

    if (respCode && respCode !== '0') {
      throw new Error(
        `WIBI rechazó consulta de saldo (${respCode}): ${respMsg || 'sin mensaje'}`,
      );
    }

    const puntosRaw =
      extractXmlTag(raw, 'Puntos') || extractXmlTag(raw, 'TotalPuntosCliente');

    if (!puntosRaw) {
      throw new Error('WIBI no devolvió campo de puntos en la respuesta');
    }

    const puntos = Number(String(puntosRaw).replace(',', '.').trim());
    if (!Number.isFinite(puntos)) {
      throw new Error(`WIBI devolvió puntos inválidos: ${puntosRaw}`);
    }

    return Math.trunc(puntos);
  }

  private async consultarClientePorTarjeta(nroTarjeta: string): Promise<string> {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>300</CodAccion>
  <NroTarjeta>${escapeXml(nroTarjeta)}</NroTarjeta>
</MensajeFidelyGb>`;

    return this.postWibiXml(xml);
  }

  private async postWibiXml(xml: string): Promise<string> {
    const token = await this.getToken();
    if (!token) throw new Error('No se pudo obtener token WIBI');

    const requestConfig: AxiosRequestConfig = {
      url: process.env.WIBI_API_URL || DEFAULT_WIBI_API_URL,
      method: 'post',
      data: xml,
      httpsAgent: this.httpsAgent,
      headers: {
        'Content-Type': 'application/xml',
        'api-key': String(process.env.WIBI_API_KEY ?? ''),
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    };

    try {
      const response = await axios(requestConfig);
      return String(response.data ?? '');
    } catch (error) {
      if (isUnauthorized(error)) {
        this.clearTokenCache();
        const retryToken = await this.getToken();
        if (!retryToken) throw error;

        const retryResponse = await axios({
          ...requestConfig,
          headers: {
            ...requestConfig.headers,
            Authorization: `Bearer ${retryToken}`,
          },
        });
        return String(retryResponse.data ?? '');
      }

      throw error;
    }
  }

  private async getToken(): Promise<string | null> {
    if (
      this.tokenCache &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt.getTime() > Date.now()
    ) {
      return this.tokenCache;
    }

    if (this.tokenInFlight) return this.tokenInFlight;

    this.tokenInFlight = this.requestToken();
    try {
      return await this.tokenInFlight;
    } finally {
      this.tokenInFlight = null;
    }
  }

  private async requestToken(): Promise<string | null> {
    const user = String(process.env.WIBI_USER ?? '');
    const pass = String(process.env.WIBI_PASS ?? '');
    const apiKey = String(process.env.WIBI_API_KEY ?? '');

    if (!user || !pass || !apiKey) {
      throw new Error(
        'Configuración WIBI incompleta (WIBI_USER/WIBI_PASS/WIBI_API_KEY)',
      );
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <CodAccion>1</CodAccion>
  <auth>
    <user>${escapeXml(user)}</user>
    <pass>${escapeXml(pass)}</pass>
  </auth>
</MensajeFidelyGb>`;

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await axios.post(
          process.env.WIBI_TOKEN_URL || DEFAULT_WIBI_TOKEN_URL,
          xml,
          {
            httpsAgent: this.httpsAgent,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/xml',
              'api-key': apiKey,
            },
          },
        );

        const raw = String(response.data ?? '');
        const token =
          extractXmlTag(raw, 'token') ||
          extractXmlTag(raw, 'jwt') ||
          extractXmlTag(raw, 'access_token') ||
          extractXmlTag(raw, 'accessToken');

        if (!token) {
          throw new Error('Token no encontrado en respuesta de WIBI');
        }

        const expRaw =
          extractXmlTag(raw, 'exp') ||
          extractXmlTag(raw, 'expires') ||
          extractXmlTag(raw, 'expiration') ||
          extractXmlTag(raw, 'expira');

        this.tokenCache = token;
        this.tokenExpiresAt =
          parseExpDate(expRaw) ?? new Date(Date.now() + 5 * 60 * 1000);
        return token;
      } catch (error) {
        lastError = error;
        if (!isConcurrentConnectionError(error) || attempt === 3) break;
        await sleep(300 * attempt);
      }
    }

    this.logger.error(`Error obteniendo token WIBI: ${toErrMessage(lastError)}`);
    return null;
  }

  private clearTokenCache(): void {
    this.tokenCache = null;
    this.tokenExpiresAt = null;
    this.tokenInFlight = null;
  }
}

function extractXmlTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = String(xml ?? '').match(regex);
  return match?.[1]?.trim() || null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseExpDate(value?: string | null): Date | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const asDate = new Date(raw.replace(' ', 'T'));
  if (!Number.isNaN(asDate.getTime())) return asDate;

  const asEpoch = Number(raw);
  if (!Number.isNaN(asEpoch) && asEpoch > 0) {
    const millis = asEpoch > 9999999999 ? asEpoch : asEpoch * 1000;
    const epochDate = new Date(millis);
    if (!Number.isNaN(epochDate.getTime())) return epochDate;
  }

  return null;
}

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  return error.response?.status === 401;
}

function isConcurrentConnectionError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  const msg = String(error.response?.data ?? error.message ?? '').toLowerCase();
  return (
    error.response?.status === 500 &&
    msg.includes('maximum number of concurrent connections exceeded')
  );
}

function toErrMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
