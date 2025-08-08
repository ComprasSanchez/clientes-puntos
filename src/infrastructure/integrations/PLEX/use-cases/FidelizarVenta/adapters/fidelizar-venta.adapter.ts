import { Inject, Injectable } from '@nestjs/common';
import { AnulacionUseCase } from '@puntos/application/use-cases/Anulacion/Anulacion';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '@puntos/application/use-cases/Devolucion/Devolucion';
import { PlexFidelizarVentaRequestDto } from '../dtos/fidelizar-venta.request.dto';
import { PlexFidelizarVentaResponseMapper } from '../dtos/fidelizar-venta.response.dto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { codFidelizarVenta } from '@infrastructure/integrations/PLEX/enums/fidelizar-venta.enum';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';

@Injectable()
export class FidelizarVentaPlexAdapter {
  constructor(
    @Inject(CompraUseCase)
    private readonly compraUseCase: CompraUseCase,
    @Inject(DevolucionUseCase)
    private readonly devolucionUseCase: DevolucionUseCase,
    @Inject(AnulacionUseCase)
    private readonly anulacionUseCase: AnulacionUseCase,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly obtenerSaldoCliente: ObtenerSaldo,
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

    // 2.1 Validar cliente
    const cliente = await this.cliente.run(plexDto.nroTarjeta.toString());

    // 3. Mapeo a dominio
    const domainRequest = {
      clienteId: cliente.id,
      puntos: Number(plexDto.puntosCanjeados),
      montoMoneda: Number(plexDto.importeTotal),
      origenTipo: 'PLEX',
      moneda: TipoMoneda.ARS,
      referencia: plexDto.nroComprobante,
      refOperacion: Number(plexDto.idMovimiento),
      codSucursal: sucId,
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

    const saldo = await this.obtenerSaldoCliente.run(cliente.id);

    // 6. Agregar los campos a la response (mapper igual que cliente)
    const responseDto = PlexFidelizarVentaResponseMapper.fromDomain({
      idMovimiento: domainResponse.handlerResult.operacion.id.value.toString(),
      puntosDescontados: domainResponse.puntosDebito ?? 0,
      puntosAcreditados: domainResponse.puntosCredito ?? 0,
      totalPuntosCliente: saldo,
    });

    // 7. Armar objeto en formato { _text: ... }
    const responseXmlObj = PlexFidelizarVentaResponseMapper.toXml(responseDto);

    // 8. Serializar XML
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlString = builder.build(responseXmlObj);

    // 9. Agregar encabezado
    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: responseDto,
    };
  }
}
