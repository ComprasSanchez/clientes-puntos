/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Headers,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FidelizarVentaPlexAdapter } from './use-cases/FidelizarVenta/adapters/fidelizar-venta.adapter';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import {
  CONSULTAR_CLIENTE_ADAPTER,
  CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER,
  CONSULTAR_NOVEDADES_CLIENTE_ADAPTER,
  FIDELIZAR_CLIENTE_ADAPTER,
  FIDELIZAR_PRODUCTO_ADAPTER,
  FIDELIZAR_VENTA_ADAPTER,
} from './tokens/tokens';
import { FidelizarClientePlexAdapter } from './use-cases/FidelizarCliente/adapters/fidelizar-cliente.adapter';
import { XMLParser } from 'fast-xml-parser';
import { codFidelizarVenta } from './enums/fidelizar-venta.enum';
import { codFidelizarCliente } from './enums/fidelizar-cliente.enum';
import { ConsultarClientePlexAdapter } from './use-cases/ConsultarCliente/adapters/consultar-cliente.adapter';
import { codConsultarCliente } from './enums/consultar-cliente.enum';
import { IntegracionMovimientoService } from '../../database/services/IntegracionMovimientoService';
import { UseCaseResponse } from './dto/usecase-response.dto';
import { ConsultarEstadisticasClientePlexAdapter } from './use-cases/ConsultarEstadisticasCliente/adapters/consultar-estadisticas-cliente.adapter';
import { codConsultarEstadisticasCliente } from './enums/consultar-estadisticas-cliente.enum';
import { Auth, AuthContext } from '@infrastructure/auth/auth.decorator';
import { codFidelizarProducto } from './enums/fidelizar-producto.enum';
import { FidelizarProductoPlexAdapter } from './use-cases/FidelizarProducto/adapters/fidelizar-producto.adapter';
import { ConsultarNovedadesClientePlexAdapter } from './use-cases/ConsultarNovedadesCliente/adapters/consultar-novedades-cliente.adapter';
import { codConsultarNovedadesCliente } from './enums/consultar-novedades-cliente.enum';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// ==== Tipos auxiliares para el XML ====

/**
 * Nodo raíz que nos importa.
 */
interface ParsedRootNode {
  CodAccion?: string | number;
  codAccion?: string | number;
  [key: string]: unknown;
}

/**
 * Objeto parseado del XML completo:
 * { MensajeFidelyGB: { CodAccion: 200, ... } }
 */
interface ParsedXml {
  [rootName: string]: ParsedRootNode;
}

// util para XML seguro en errores
function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@ApiTags('Integraciones - PLEX')
@ApiBearerAuth()
@Controller('onzecrm')
export class PlexController {
  private readonly requestTimeoutMs =
    Number(process.env.PLEX_REQUEST_TIMEOUT_MS ?? '20000') || 20000;

  constructor(
    @Inject(FIDELIZAR_VENTA_ADAPTER)
    private readonly ventaAdapter: FidelizarVentaPlexAdapter,
    @Inject(FIDELIZAR_CLIENTE_ADAPTER)
    private readonly clienteAdapter: FidelizarClientePlexAdapter,
    @Inject(CONSULTAR_CLIENTE_ADAPTER)
    private readonly consultarClienteAdapter: ConsultarClientePlexAdapter,
    @Inject(CONSULTAR_ESTADISTICAS_CLIENTE_ADAPTER)
    private readonly consultarEstadisticasAdapter: ConsultarEstadisticasClientePlexAdapter,
    @Inject(FIDELIZAR_PRODUCTO_ADAPTER)
    private readonly fidelizarProductoAdapter: FidelizarProductoPlexAdapter,
    @Inject(CONSULTAR_NOVEDADES_CLIENTE_ADAPTER)
    private readonly consultarNovedadesAdapter: ConsultarNovedadesClientePlexAdapter,
    @Inject(IntegracionMovimientoService)
    private readonly integracionMovimientoService: IntegracionMovimientoService,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout interno de ${timeoutMs}ms`));
      }, timeoutMs);

      void promise.then(
        (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      );
    });
  }

  private executeUseCase(
    accionValue: string,
    xmlIncoming: string,
    auth: AuthContext,
  ): Promise<UseCaseResponse> {
    if ((Object.values(codFidelizarVenta) as string[]).includes(accionValue)) {
      return this.transactionalRunner.runInTransaction((ctx) =>
        this.ventaAdapter.handle(
          xmlIncoming,
          auth.codigoExt!, // sucursal externa del token
          ctx,
        ),
      );
    }

    if (
      (Object.values(codFidelizarCliente) as string[]).includes(accionValue)
    ) {
      return this.transactionalRunner.runInTransaction((ctx) =>
        this.clienteAdapter.handle(xmlIncoming, ctx),
      );
    }

    if (
      (Object.values(codConsultarCliente) as string[]).includes(accionValue)
    ) {
      return this.consultarClienteAdapter.handle(xmlIncoming);
    }

    if (
      (Object.values(codConsultarEstadisticasCliente) as string[]).includes(
        accionValue,
      )
    ) {
      return this.consultarEstadisticasAdapter.handle(xmlIncoming);
    }

    if (
      (Object.values(codFidelizarProducto) as string[]).includes(accionValue)
    ) {
      return this.fidelizarProductoAdapter.handle(xmlIncoming);
    }

    if (
      (Object.values(codConsultarNovedadesCliente) as string[]).includes(
        accionValue,
      )
    ) {
      return this.consultarNovedadesAdapter.handle(
        xmlIncoming,
        auth.codigoExt ?? '',
      );
    }

    throw new Error('codAccion inválido o no soportado');
  }

  @Post()
  @ApiOperation({
    summary: 'Procesa mensaje XML de PLEX por CodAccion',
    description:
      'Endpoint multipropósito. Recibe XML MensajeFidelyGB, enruta por CodAccion y responde XML.',
  })
  @ApiConsumes('application/xml')
  @ApiProduces('application/xml')
  @ApiBody({
    required: true,
    schema: {
      type: 'string',
      example:
        '<?xml version="1.0" encoding="UTF-8"?><MensajeFidelyGB><CodAccion>200</CodAccion><Venta><NroTarjeta>123</NroTarjeta></Venta></MensajeFidelyGB>',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta XML exitosa.',
    schema: {
      type: 'string',
      example:
        '<?xml version="1.0" encoding="utf-8"?><RespuestaFidelyGb><RespCode>0</RespCode><RespMsg>OK</RespMsg></RespuestaFidelyGb>',
    },
  })
  @ApiResponse({ status: 400, description: 'XML inválido o body vacío.' })
  @ApiResponse({
    status: 415,
    description: 'Content-Type inválido. Debe ser application/xml.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error de negocio/integración. Retorna XML de error.',
  })
  @UseGuards(ApiJwtGuard)
  //Authz V1 local integrado con kaycloak
  @Authz({
    allowedAzp: ['plex-integration', 'puntos-fsa'],
    requiredRealmRoles: ['integration:plex'],
  })
  async plex(
    @Auth() auth: AuthContext,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('content-type') contentType: string,
  ): Promise<void> {
    // --- LOG INICIAL DE REQUEST ---

    // content-type real
    const ct = contentType?.toLowerCase() ?? '(none)';
    // raw body (lo tomamos antes de parsear)
    const xmlIncoming =
      req.body instanceof Buffer
        ? req.body.toString('utf-8')
        : (req.body as string);

    // 1. Validar Content-Type
    if (!ct.includes('xml')) {
      res.status(415).send('Content-Type must be application/xml');
      return;
    }

    // 2. Validar body no vacío
    if (
      !xmlIncoming ||
      typeof xmlIncoming !== 'string' ||
      !xmlIncoming.trim()
    ) {
      res.status(400).send('Empty XML body');
      return;
    }

    // 3. Parsear el XML a JS
    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    let parsedUnknown: unknown;
    try {
      parsedUnknown = parser.parse(xmlIncoming);
    } catch (err: unknown) {
      res.status(400).send('XML inválido');
      return;
    }

    // 4. Validar raíz MensajeFidelyGB / MensajeFidelyGb
    if (
      !parsedUnknown ||
      typeof parsedUnknown !== 'object' ||
      Array.isArray(parsedUnknown)
    ) {
      throw new Error('XML malformado o sin MensajeFidelyGb');
    }

    const parsedObj = parsedUnknown as ParsedXml;

    const rootKey = Object.keys(parsedObj).find(
      (k) => k.toLowerCase() === 'mensajefidelygb',
    );

    if (!rootKey) {
      throw new Error('XML malformado o sin MensajeFidelyGb');
    }

    const mensajeNodeUnknown = parsedObj[rootKey];

    if (
      !mensajeNodeUnknown ||
      typeof mensajeNodeUnknown !== 'object' ||
      Array.isArray(mensajeNodeUnknown)
    ) {
      throw new Error('XML malformado o sin MensajeFidelyGb');
    }

    const mensajeNode = mensajeNodeUnknown;

    // 5. Extraer CodAccion
    const codAccionRaw = mensajeNode.CodAccion ?? mensajeNode.codAccion ?? '';

    // 6. Registrar movimiento en la base
    const movimiento =
      await this.integracionMovimientoService.registrarMovimiento({
        tipoIntegracion: 'ONZECRM',
        txTipo: String(codAccionRaw ?? ''),
        requestPayload: parsedObj as Record<string, unknown>,
        status: 'IN_PROGRESS',
      });

    try {
      const codAccionStr =
        codAccionRaw !== undefined ? String(codAccionRaw) : undefined;

      if (!codAccionStr) {
        throw new Error('codAccion no encontrado en el XML');
      }

      // Asegurarnos de quedarnos sólo con el número (por si viene "200 " o "200\r\n")
      const accionMatch = codAccionStr.match(/\d+/);
      const accionValue = accionMatch ? accionMatch[0] : codAccionStr;

      // 7. Ejecutar caso de uso con timeout interno
      const responseXml: UseCaseResponse = await this.withTimeout(
        this.executeUseCase(accionValue, xmlIncoming, auth),
        this.requestTimeoutMs,
      );

      // log respuesta OK antes de persistir

      // 8. Guardar OK en la tabla de movimientos
      await this.integracionMovimientoService.actualizarMovimiento(
        movimiento.id,
        {
          status: 'OK',
          responsePayload: responseXml,
        },
      );

      // 9. Responder al caller final
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(responseXml.response);
    } catch (error: unknown) {
      // 10. Manejo de error

      let msg: string;
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else {
        try {
          msg = JSON.stringify(error);
        } catch {
          msg = 'Error inesperado';
        }
      }

      // persistimos el error
      try {
        await this.integracionMovimientoService.actualizarMovimiento(
          movimiento.id,
          {
            status: 'ERROR',
            mensajeError: msg,
          },
        );
      } catch {
        // Evita dejar colgada la respuesta si falla la persistencia del error
      }

      // respuesta xml de error (IMPORTANTE: escapamos msg)
      const errorXml =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        `<RespuestaFidelyGb>` +
        `<RespCode>1</RespCode>` +
        `<RespMsg>${escapeXml(msg)}</RespMsg>` +
        `</RespuestaFidelyGb>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.status(500).send(errorXml);
    }
  }
}
