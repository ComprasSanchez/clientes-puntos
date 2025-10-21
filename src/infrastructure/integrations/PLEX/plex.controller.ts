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

// Tipo explícito para parseo seguro
interface MensajeFidelyGb {
  MensajeFidelyGb?: {
    CodAccion?: string;
    [key: string]: unknown;
  };
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
    if (!contentType?.includes('xml')) {
      res.status(415).send('Content-Type must be application/xml');
      return;
    }

    const xml: string =
      req.body instanceof Buffer ? req.body.toString() : (req.body as string);

    const parser = new XMLParser();

    // Tipar el parseo
    const json = parser.parse(xml) as MensajeFidelyGb;

    if (
      !json ||
      typeof json !== 'object' ||
      !('MensajeFidelyGb' in json) ||
      typeof json.MensajeFidelyGb !== 'object'
    ) {
      throw new Error('XML malformado o sin MensajeFidelyGb');
    }

    const codAccionRaw = json?.MensajeFidelyGb?.CodAccion || '';

    const movimiento =
      await this.integracionMovimientoService.registrarMovimiento({
        tipoIntegracion: 'ONZECRM',
        txTipo: String(codAccionRaw), // <- te aseguras que es string
        requestPayload: json as Record<string, unknown>, // <- bien tipado
        status: 'IN_PROGRESS',
      });

    try {
      const responseXml: UseCaseResponse =
        await this.transactionalRunner.runInTransaction(async (ctx) => {
          // Validación explícita y casteo
          const codAccion =
            codAccionRaw !== undefined ? String(codAccionRaw) : undefined;
          if (!codAccion) {
            throw new Error('codAccion no encontrado en el XML');
          }

          const accionMatch = codAccion.match(/\d+/);
          const accionValue = accionMatch ? accionMatch[0] : codAccion;

          if (
            (Object.values(codFidelizarVenta) as string[]).includes(accionValue)
          ) {
            // Si querés, podés castear a codFidelizarVenta, pero si tu handle espera string, está OK así.
            return this.ventaAdapter.handle(xml, auth.codigoExt!, ctx);
          }
          if (
            (Object.values(codFidelizarCliente) as string[]).includes(
              accionValue,
            )
          ) {
            return this.clienteAdapter.handle(xml, ctx);
          }
          if (
            (Object.values(codConsultarCliente) as string[]).includes(
              accionValue,
            )
          ) {
            return this.consultarClienteAdapter.handle(xml);
          }
          if (
            (
              Object.values(codConsultarEstadisticasCliente) as string[]
            ).includes(accionValue)
          ) {
            return this.consultarEstadisticasAdapter.handle(xml);
          }
          if (
            (Object.values(codFidelizarProducto) as string[]).includes(
              accionValue,
            )
          ) {
            return this.fidelizarProductoAdapter.handle(xml);
          }

          throw new Error('codAccion inválido o no soportado');
        });

      await this.integracionMovimientoService.actualizarMovimiento(
        movimiento.id,
        {
          status: 'OK',
          responsePayload: responseXml,
        },
      );

      res.set('Content-Type', 'application/xml');
      res.status(200).send(responseXml.response);
    } catch (error: unknown) {
      let msg = 'Error inesperado';

      // Esta es la forma segura y recomendada:
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else {
        msg = JSON.stringify(error); // fallback para otros tipos
      }

      await this.integracionMovimientoService.actualizarMovimiento(
        movimiento.id,
        {
          status: 'ERROR',
          mensajeError: msg,
        },
      );

      const errorXml = `<?xml version="1.0" encoding="utf-8"?><RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>${msg}</RespMsg></RespuestaFidelyGb>`;
      res.set('Content-Type', 'application/xml');
      res.status(500).send(errorXml);
    }
  }
}
