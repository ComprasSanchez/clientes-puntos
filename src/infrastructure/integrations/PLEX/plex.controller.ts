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
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

// ==== Tipos auxiliares para el XML ====

/**
 * Este es el shape mínimo que necesitamos del nodo raíz real
 * (MensajeFidelyGB / MensajeFidelyGb / etc.)
 */
interface ParsedRootNode {
  CodAccion?: string | number;
  codAccion?: string | number;
  // ...podrías ir sumando más campos si necesitás validarlos fuerte
  [key: string]: unknown;
}

/**
 * Shape del XML parseado entero:
 * no sabemos cómo se llama la root key exactamente,
 * pero sabemos que será un objeto con al menos CodAccion.
 */
interface ParsedXml {
  [rootName: string]: ParsedRootNode;
}

@Controller('onzecrm')
export class PlexController {
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
    @Inject(IntegracionMovimientoService)
    private readonly integracionMovimientoService: IntegracionMovimientoService,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Post()
  @UseGuards(ApiJwtGuard)
  @Authz({
    allowedAzp: ['plex-integration'],
    requiredRealmRoles: ['integration:plex'],
  })
  async plex(
    @Auth() auth: AuthContext,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('content-type') contentType: string,
  ): Promise<void> {
    // 1. Validar Content-Type
    if (!contentType?.toLowerCase().includes('xml')) {
      res.status(415).send('Content-Type must be application/xml');
      return;
    }

    // 2. Obtener XML entrante como string UTF-8
    const xmlIncoming =
      req.body instanceof Buffer
        ? req.body.toString('utf-8')
        : (req.body as string);

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
    } catch (err) {
      res.status(400).send('XML inválido');
      return;
    }

    // 4. Validar que parsedUnknown tenga la forma ParsedXml
    //    y ubicar la root key tipo "MensajeFidelyGB"
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

    // mensajeNode debe ser objeto simple, no array
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

    // registramos movimiento antes de ejecutar
    const movimiento =
      await this.integracionMovimientoService.registrarMovimiento({
        tipoIntegracion: 'ONZECRM',
        txTipo: String(codAccionRaw ?? ''),
        requestPayload: parsedObj as Record<string, unknown>,
        status: 'IN_PROGRESS',
      });

    try {
      // 6. Ejecutar caso de uso
      const responseXml: UseCaseResponse =
        await this.transactionalRunner.runInTransaction(async (ctx) => {
          const codAccionStr =
            codAccionRaw !== undefined ? String(codAccionRaw) : undefined;

          if (!codAccionStr) {
            throw new Error('codAccion no encontrado en el XML');
          }

          const accionMatch = codAccionStr.match(/\d+/);
          const accionValue = accionMatch ? accionMatch[0] : codAccionStr;

          if (
            (Object.values(codFidelizarVenta) as string[]).includes(accionValue)
          ) {
            return this.ventaAdapter.handle(xmlIncoming, auth.codigoExt!, ctx);
          }

          if (
            (Object.values(codFidelizarCliente) as string[]).includes(
              accionValue,
            )
          ) {
            return this.clienteAdapter.handle(xmlIncoming, ctx);
          }

          if (
            (Object.values(codConsultarCliente) as string[]).includes(
              accionValue,
            )
          ) {
            return this.consultarClienteAdapter.handle(xmlIncoming);
          }

          if (
            (
              Object.values(codConsultarEstadisticasCliente) as string[]
            ).includes(accionValue)
          ) {
            return this.consultarEstadisticasAdapter.handle(xmlIncoming);
          }

          if (
            (Object.values(codFidelizarProducto) as string[]).includes(
              accionValue,
            )
          ) {
            return this.fidelizarProductoAdapter.handle(xmlIncoming);
          }

          throw new Error('codAccion inválido o no soportado');
        });

      // 7. Persist OK
      await this.integracionMovimientoService.actualizarMovimiento(
        movimiento.id,
        {
          status: 'OK',
          responsePayload: responseXml,
        },
      );

      // 8. Responder al caller final
      res.set('Content-Type', 'application/xml');
      res.status(200).send(responseXml.response);
    } catch (error: unknown) {
      let msg = 'Error inesperado';

      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else {
        msg = JSON.stringify(error);
      }

      // 9. Persist ERROR
      await this.integracionMovimientoService.actualizarMovimiento(
        movimiento.id,
        {
          status: 'ERROR',
          mensajeError: msg,
        },
      );

      // 10. Armar respuesta de error para PLEX
      const errorXml =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        `<RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>${msg}</RespMsg></RespuestaFidelyGb>`;

      res.set('Content-Type', 'application/xml');
      res.status(500).send(errorXml);
    }
  }
}
