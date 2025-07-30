import { Controller, Headers, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { FidelizarVentaPlexAdapter } from './use-cases/FidelizarVenta/adapters/fidelizar-venta.adapter';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { FIDELIZAR_VENTA_ADAPTER } from './tokens/tokens';

@Controller('onzecrm')
export class PlexController {
  constructor(
    @Inject(FIDELIZAR_VENTA_ADAPTER)
    private readonly adapter: FidelizarVentaPlexAdapter,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Post()
  async fidelizarVenta(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('content-type') contentType: string,
  ): Promise<void> {
    // Solo acepta XML
    if (!contentType?.includes('xml')) {
      res.status(415).send('Content-Type must be application/xml');
      return;
    }

    // Raw XML
    const xml: string =
      req.body instanceof Buffer ? req.body.toString() : (req.body as string);

    try {
      const responseXml: string =
        await this.transactionalRunner.runInTransaction(async (ctx) => {
          // El método handle debe devolver string XML (ya tipado)
          return await this.adapter.handle(xml, ctx);
        });

      res.set('Content-Type', 'application/xml');
      res.status(200).send(responseXml);
    } catch (error: unknown) {
      // Manejo seguro del error tipado (evita acceder a .message si no existe)
      let msg = 'Error inesperado';
      if (error instanceof Error) msg = error.message;
      // También podés loguear el error para debugging

      const errorXml = `<?xml version="1.0" encoding="utf-8"?><RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>${msg}</RespMsg></RespuestaFidelyGb>`;
      res.set('Content-Type', 'application/xml');
      res.status(500).send(errorXml);
    }
  }
}
