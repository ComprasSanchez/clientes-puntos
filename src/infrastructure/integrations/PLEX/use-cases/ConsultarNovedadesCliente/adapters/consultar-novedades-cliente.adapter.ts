import { ClienteFindUpdatedBetween } from '@cliente/application/use-cases/ClienteFindUpdatedBetween/ClienteFindUpdatedBetween';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { Inject, Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { codConsultarNovedadesCliente } from '@infrastructure/integrations/PLEX/enums/consultar-novedades-cliente.enum';
import { PlexConsultarNovedadesClienteRequestMapper } from '../dtos/consultar-novedades-cliente.request.dto';
import { PlexConsultarNovedadesClienteResponseMapper } from '../dtos/consultar-novedades-cliente.response.dto';

@Injectable()
export class ConsultarNovedadesClientePlexAdapter {
  constructor(
    @Inject(ClienteFindUpdatedBetween)
    private readonly clienteFindUpdatedBetween: ClienteFindUpdatedBetween,
  ) {}

  async handle(xml: string, sucursal: string): Promise<UseCaseResponse> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });

    const parsedObj = parser.parse(xml) as unknown;
    const plexDto =
      PlexConsultarNovedadesClienteRequestMapper.fromXml(parsedObj);

    if (
      String(plexDto.codAccion) !==
      String(codConsultarNovedadesCliente.CONSULTAR_NOVEDADES)
    ) {
      throw new Error(`Accion no soportada: ${plexDto.codAccion}`);
    }

    const from = this.parsePlexDateTime(plexDto.fechaDesde, 'FechaDesde');
    const to = this.parsePlexDateTime(plexDto.fechaHasta, 'FechaHasta');

    if (from.getTime() > to.getTime()) {
      throw new Error('FechaDesde debe ser menor o igual a FechaHasta');
    }

    const clientes = await this.clienteFindUpdatedBetween.run({ from, to });

    const responseDto = PlexConsultarNovedadesClienteResponseMapper.fromDomain({
      clientes,
      sucursal,
    });

    const xmlObj = PlexConsultarNovedadesClienteResponseMapper.toXml(
      responseDto,
    ) as unknown;

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${builder.build(xmlObj)}`,
      dto: responseDto,
    };
  }

  private parsePlexDateTime(raw: string, field: string): Date {
    const value = raw?.trim();
    const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(
      value,
    );

    if (!match) {
      throw new Error(
        `${field} invalida. Formato esperado: dd/mm/yyyy HH:nn:ss`,
      );
    }

    const [, dd, mm, yyyy, hh, nn, ss] = match;
    const date = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(nn),
      Number(ss),
    );

    const isValid =
      date.getFullYear() === Number(yyyy) &&
      date.getMonth() === Number(mm) - 1 &&
      date.getDate() === Number(dd) &&
      date.getHours() === Number(hh) &&
      date.getMinutes() === Number(nn) &&
      date.getSeconds() === Number(ss);

    if (!isValid) {
      throw new Error(`${field} invalida: ${raw}`);
    }

    return date;
  }
}
