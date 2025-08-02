import { Inject, Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { PlexConsultarClienteRequestMapper } from '../dtos/consultar-cliente.request.dto';
import { codConsultarCliente } from '@infrastructure/integrations/PLEX/enums/consultar-cliente.enum';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { valorPuntoEnPesos } from '@shared/core/utils/puntoToMoneda';
import { PlexConsultarClienteResponseMapper } from '../dtos/consultar-cliente.response.dto';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';

@Injectable()
export class ConsultarClientePlexAdapter {
  constructor(
    @Inject(ClienteFindByTarjeta)
    private readonly findByTarjeta: ClienteFindByTarjeta,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly saldoService: ObtenerSaldo,
    @Inject(ReglaFindCotizacion)
    private readonly getCotizacion: ReglaFindCotizacion,
  ) {}

  async handle(xml: string): Promise<UseCaseResponse> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsedObj = parser.parse(xml) as unknown;

    const plexDto = PlexConsultarClienteRequestMapper.fromXml(parsedObj);

    if (String(plexDto.codAccion) !== String(codConsultarCliente.CONSULTA)) {
      throw new Error(`Acción no soportada: ${plexDto.codAccion}`);
    }
    const domainResponse: ClienteResponseDto | null =
      await this.findByTarjeta.run(plexDto.nroTarjeta.toString());

    if (domainResponse === null) {
      throw new Error(
        `Cliente con tarjeta ${plexDto.nroTarjeta} no encontrado.`,
      );
    }

    const saldo = await this.saldoService.run(domainResponse.id);

    const cotizacion = await this.getCotizacion.run();

    const valorPorPunto = valorPuntoEnPesos(cotizacion.rateSpendVo.value);

    const dto = PlexConsultarClienteResponseMapper.fromDomain({
      idClienteFidely: domainResponse.idFidely!.toString(),
      campania: process.env.CAMPANIA_ID!,
      categoria: domainResponse.categoria,
      nombre: domainResponse.nombre,
      apellido: domainResponse.apellido,
      fecNac: domainResponse.fechaNacimiento,
      dni: domainResponse.dni,
      telefono: domainResponse.telefono,
      celular: null,
      direccion: domainResponse.direccion,
      email: domainResponse.email,
      sexo: domainResponse.sexo,
      codPostal: domainResponse.codPostal,
      puntos: saldo,
      valorPunto: valorPorPunto,
      porcentualCompra: null,
      porcentualPunto: null,
    });

    const xmlObj = PlexConsultarClienteResponseMapper.toXml(dto) as unknown;

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });
    const xmlString = builder.build(xmlObj);

    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: dto,
    };
  }
}
