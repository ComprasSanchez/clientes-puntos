import { ClienteFindByDni } from '@cliente/application/use-cases/ClienteFindByDni/ClienteFindByDni';
import { Inject, Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';
import { GetMetricasCliente } from 'src/context/Metricas/application/clientes/use-cases/GetMetricasCliente';
import { PlexConsultarEstadisticaClienteRequestMapper } from '../dtos/consultar-estadisticas.request.dto';
import { PlexConsultarEstadisticaClienteResponseMapper } from '../dtos/consultar-estadisticas.response.dto';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { GET_METRICAS_CLIENTE_USECASE } from 'src/context/Metricas/core/reglas/tokens/tokens';

@Injectable()
export class ConsultarEstadisticasClientePlexAdapter {
  constructor(
    @Inject(ClienteFindByDni)
    private readonly clienteFindByDni: ClienteFindByDni,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly saldoService: ObtenerSaldo,
    @Inject(GET_METRICAS_CLIENTE_USECASE)
    private readonly metricaUC: GetMetricasCliente,
  ) {}

  async handle(xml: string): Promise<UseCaseResponse> {
    // 1. Parsear XML para obtener el DNI
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsedObj = parser.parse(xml) as unknown;

    // Aca depende de la estructura de tu XML, ajusta la ruta
    const plexDto =
      PlexConsultarEstadisticaClienteRequestMapper.fromXml(parsedObj);

    const dni = plexDto?.dni;
    if (!dni) {
      throw new Error('DNI no especificado en el XML.');
    }

    // 2. Buscar cliente por DNI
    const cliente = await this.clienteFindByDni.run(String(dni));
    if (!cliente) {
      throw new Error(`Cliente con DNI ${dni} no encontrado.`);
    }

    // 3. Obtener saldo
    const saldo = await this.saldoService.run(cliente.id);

    // 4. Obtener métricas del cliente
    const fechaFin = new Date(); // hoy
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 3);

    const metricas = await this.metricaUC.run(
      cliente.id,
      fechaInicio,
      fechaFin,
    );

    // 5. Mapear respuesta a formato esperado (deberías armar tu propio mapper/DTO de salida)
    const domainResponse = {
      idClienteFidely: cliente.idFidely!,
      categoria: cliente.categoria,
      saldoPuntos: saldo,
      pesosAhorroUltimoMes: metricas.pesosAhorroUltimoMes,
      pesosAhorro3Meses: metricas.pesosAhorro3Meses,
      puntosUltimoMes: metricas.puntosUltimoMes,
      puntos3Meses: metricas.puntos3Meses,
      movimientosUltimoMes: metricas.movimientosUltimoMes,
      movimientos3Meses: metricas.movimientos3Meses,
    };

    const responseDto =
      PlexConsultarEstadisticaClienteResponseMapper.fromDomain(domainResponse);

    // 7. Armar XML de respuesta con el mapper
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });
    const xmlObj = PlexConsultarEstadisticaClienteResponseMapper.toXml(
      responseDto,
    ) as unknown;
    const xmlString = builder.build(xmlObj);

    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: responseDto,
    };
  }
}
