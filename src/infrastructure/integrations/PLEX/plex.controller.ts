import { Controller, Headers, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { FidelizarVentaPlexAdapter } from './use-cases/FidelizarVenta/adapters/fidelizar-venta.adapter';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import {
  FIDELIZAR_CLIENTE_ADAPTER,
  FIDELIZAR_VENTA_ADAPTER,
} from './tokens/tokens';
import { FidelizarClientePlexAdapter } from './use-cases/FidelizarCliente/adapters/fidelizar-cliente.adapter';
import { XMLParser } from 'fast-xml-parser';
import { codFidelizarVenta } from './enums/fidelizar-venta.enum';
import { codFidelizarCliente } from './enums/fidelizar-cliente.enum';

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
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Post()
  async fidelizarVenta(
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

    try {
      const responseXml: string =
        await this.transactionalRunner.runInTransaction(async (ctx) => {
          const parser = new XMLParser();
          // Tipar el parseo
          const json = parser.parse(xml) as MensajeFidelyGb;
          const codAccionRaw = json?.MensajeFidelyGb?.CodAccion;
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
            return this.ventaAdapter.handle(xml, ctx);
          }
          if (
            (Object.values(codFidelizarCliente) as string[]).includes(
              accionValue,
            )
          ) {
            return this.clienteAdapter.handle(xml, ctx);
          }

          throw new Error('codAccion inválido o no soportado');
        });

      res.set('Content-Type', 'application/xml');
      res.status(200).send(responseXml);
    } catch (error: unknown) {
      let msg = 'Error inesperado';
      if (error instanceof Error) msg = error.message;
      const errorXml = `<?xml version="1.0" encoding="utf-8"?><RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>${msg}</RespMsg></RespuestaFidelyGb>`;
      res.set('Content-Type', 'application/xml');
      res.status(500).send(errorXml);
    }
  }
}
