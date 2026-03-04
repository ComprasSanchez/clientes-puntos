import { Inject, Injectable } from '@nestjs/common';
import { AnulacionUseCase } from '@puntos/application/use-cases/Anulacion/Anulacion';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '@puntos/application/use-cases/Devolucion/Devolucion';
import { PlexFidelizarVentaRequestDto } from '../dtos/fidelizar-venta.request.dto';
import { PlexFidelizarVentaResponseMapper } from '../dtos/fidelizar-venta.response.dto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { codFidelizarVenta } from '@infrastructure/integrations/PLEX/enums/fidelizar-venta.enum';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import {
  toDec,
  toInt,
} from '@infrastructure/integrations/PLEX/utils/num-parse';

@Injectable()
export class FidelizarVentaPlexAdapter {
  constructor(
    @Inject(CompraUseCase)
    private readonly compraUseCase: CompraUseCase,
    @Inject(DevolucionUseCase)
    private readonly devolucionUseCase: DevolucionUseCase,
    @Inject(AnulacionUseCase)
    private readonly anulacionUseCase: AnulacionUseCase,
    @Inject(ClienteFindByTarjeta)
    private readonly cliente: ClienteFindByTarjeta,
  ) {}

  async handle(
    xml: string,
    sucId: string,
    ctx?: TransactionContext,
  ): Promise<UseCaseResponse> {
    // 1. Parseo XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsedObj = parser.parse(xml) as unknown;

    // 2. DTO integración
    const plexDto = PlexFidelizarVentaRequestDto.fromXml(parsedObj);

    // 2.1 Buscar cliente
    const cliente = await this.cliente.run(plexDto.nroTarjeta.toString());

    // 3. Mapeo a dominio
    const puntosCanjeados = toDec(plexDto.puntosCanjeados) ?? 0;
    const importeTotal = toDec(plexDto.importeTotal) ?? 0;

    const refOperacionRaw = toInt(plexDto.idMovimiento);
    const refOperacion =
      typeof refOperacionRaw === 'number' && refOperacionRaw > 0
        ? refOperacionRaw
        : undefined;

    const domainRequest = {
      clienteId: cliente.id,
      puntos: puntosCanjeados,
      montoMoneda: importeTotal,
      origenTipo: 'PLEX' as const,
      moneda: TipoMoneda.ARS,
      referencia: plexDto.nroComprobante || undefined,
      refOperacion,
      codSucursal: sucId,
      productos: plexDto.productos?.map((p) => ({
        codExt: p.idProducto,
        cantidad: Math.max(1, toInt(p.cantidad) ?? 1),
        precio: toDec(p.precio) ?? 0,
      })),
    };

    // 4. Elegir use case según codAccion
    let domainResponse: CreateOperacionResponse;
    switch (plexDto.codAccion as codFidelizarVenta) {
      case codFidelizarVenta.VENTA:
        domainResponse = await this.compraUseCase.run(domainRequest, ctx);
        break;
      case codFidelizarVenta.DEVOLUCION:
        domainResponse = await this.devolucionUseCase.run(domainRequest, ctx);
        break;
      case codFidelizarVenta.ANULACION:
        domainResponse = await this.anulacionUseCase.run(domainRequest, ctx);
        break;
      default:
        throw new Error(`CodAccion desconocido: ${plexDto.codAccion}`);
    }

    // 5. Armar DTO de salida Fidely
    const responseDto = PlexFidelizarVentaResponseMapper.fromDomain({
      idMovimiento: domainResponse.handlerResult.operacion.id.value.toString(),
      puntosDescontados: domainResponse.puntosDebito ?? 0,
      puntosAcreditados: domainResponse.puntosCredito ?? 0,
      totalPuntosCliente: domainResponse.handlerResult.saldoNuevo,
    });

    // 6. Armar objeto para XML
    const responseXmlObj = PlexFidelizarVentaResponseMapper.toXml(responseDto);

    // 7. Serializar XML
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlString = builder.build(responseXmlObj);

    const finalResponse = `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`;

    // 8. Retornar respuesta
    return {
      response: finalResponse,
      dto: responseDto,
    };
  }
}
