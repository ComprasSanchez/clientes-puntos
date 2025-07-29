import { Inject, Injectable } from '@nestjs/common';
import { AnulacionUseCase } from '@puntos/application/use-cases/Anulacion/Anulacion';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '@puntos/application/use-cases/Devolucion/Devolucion';
import { js2xml, xml2js } from 'xml-js';
import { PlexFidelizarVentaRequestDto } from '../dtos/fidelizar-venta.request.dto';
import { PlexFidelizarVentaResponseDto } from '../dtos/fidelizar-venta.response.dto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { codFidelizarVenta } from '@infrastructure/integrations/PLEX/enums/fidelizar-venta.enum';

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
    @Inject(CLIENTE_REPO)
    private readonly cliente: ClienteFindByTarjeta,
  ) {}

  async handle(xml: string, ctx?: TransactionContext): Promise<string> {
    // 1. Parseo XML
    const parsedObj = xml2js(xml, { compact: true });

    // 2. DTO integración
    const plexDto = PlexFidelizarVentaRequestDto.fromXml(parsedObj);

    // 2.1 Validar cliente
    const cliente = await this.cliente.run(plexDto.nroTarjeta);

    // 3. Mapeo a dominio
    const domainRequest = {
      clienteId: cliente.id,
      puntos: plexDto.puntosCanjeados,
      montoMoneda: plexDto.importeTotal,
      origenTipo: 'PLEX',
      moneda: TipoMoneda.ARS,
      referencia: plexDto.nroComprobante,
      refOperacion: Number(plexDto.idMovimiento),
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

    // 6. Agregar los campos a la response
    const responseDto = PlexFidelizarVentaResponseDto.fromDomain({
      idMovimiento: domainResponse.operacionId.toString(),
      puntosDescontados: domainResponse.puntosDebito ?? 0,
      puntosAcreditados: domainResponse.puntosCredito ?? 0,
      totalPuntosCliente: saldo,
    });

    // 7. Armar XML response
    const responseXmlObj = {
      RespuestaFidelyGb: {
        RespCode: { _text: responseDto.respCode },
        RespMsg: { _text: responseDto.respMsg },
        Venta: {
          IdMovimiento: { _text: responseDto.idMovimiento },
          PuntosDescontados: {
            _text: responseDto.puntosDescontados.toString(),
          }, // Muestra los nuevos campos
          PuntosAcreditados: {
            _text: responseDto.puntosAcreditados.toString(),
          },
          TotalPuntosCliente: {
            _text: responseDto.totalPuntosCliente?.toString() || '0',
          },
        },
      },
    };

    return js2xml(responseXmlObj, { compact: true, spaces: 2 });
  }
}
