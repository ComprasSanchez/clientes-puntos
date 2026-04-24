import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteFindUpdatedBetween } from '@cliente/application/use-cases/ClienteFindUpdatedBetween/ClienteFindUpdatedBetween';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { codConsultarNovedadesCliente } from '@infrastructure/integrations/PLEX/enums/consultar-novedades-cliente.enum';
import { ClientesFsaClienteDto } from '@infrastructure/integrations/CLIENTES/dto/clientes-fsa.dto';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { PlexConsultarNovedadesClienteRequestMapper } from '../dtos/consultar-novedades-cliente.request.dto';
import { PlexConsultarNovedadesClienteResponseMapper } from '../dtos/consultar-novedades-cliente.response.dto';

@Injectable()
export class ConsultarNovedadesClientePlexAdapter {
  private readonly logger = new Logger(
    ConsultarNovedadesClientePlexAdapter.name,
  );

  constructor(
    @Inject(ClienteFindUpdatedBetween)
    private readonly clienteFindUpdatedBetween: ClienteFindUpdatedBetween,
    @Inject(ClientesFsaClient)
    private readonly clientesFsaClient: ClientesFsaClient,
  ) { }

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

    const clientes = await this.clienteFindUpdatedBetween.run(
      { from, to },
      { skipCanonicalHydration: true },
    );
    const clientesCanonicos = await this.enrichClientesConCanonico(clientes);

    const responseDto = PlexConsultarNovedadesClienteResponseMapper.fromDomain({
      clientes: clientesCanonicos,
      sucursal,
    });

    const xmlObj =
      PlexConsultarNovedadesClienteResponseMapper.toXml(responseDto);

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

  private async enrichClientesConCanonico(
    clientes: ClienteResponseDto[],
  ): Promise<ClienteResponseDto[]> {
    const dnis = Array.from(
      new Set(
        clientes
          .map((cliente) => this.normalizeDni(cliente.dni))
          .filter((dni) => dni.length > 0),
      ),
    );

    if (!dnis.length) {
      return clientes;
    }

    let canonicosByDni: Map<string, ClientesFsaClienteDto>;
    try {
      canonicosByDni = await this.clientesFsaClient.findManyByDni(dnis);
    } catch (error) {
      this.logger.warn(
        {
          requested: dnis.length,
          message: error instanceof Error ? error.message : String(error),
        },
        'No se pudo enriquecer clientes desde clientes-fsa (bulk)',
      );
      return clientes;
    }

    return clientes.map((cliente) => {
      const canonico = canonicosByDni.get(this.normalizeDni(cliente.dni));

      if (!canonico) {
        return cliente;
      }

      const telefono = this.pickBestContactoByTipo(canonico, ['TELEFONO']);
      const email = this.pickBestContactoByTipo(canonico, ['EMAIL']);
      const direccion = this.extractDireccion(canonico);
      const codPostal = this.extractCodPostal(canonico);
      const localidad = this.extractLocalidad(canonico);
      const provincia = this.extractProvincia(canonico);
      const fechaNacimiento = this.normalizeFechaNacimiento(
        this.extractFechaNacimiento(canonico),
      );
      const sexo = this.extractSexo(canonico);

      return {
        ...cliente,
        nombre: canonico.nombre ?? cliente.nombre,
        apellido: canonico.apellido ?? cliente.apellido,
        dni: canonico.documento?.numero ?? cliente.dni,
        telefono: telefono ?? canonico.telefono ?? cliente.telefono,
        email: email ?? canonico.email ?? cliente.email,
        direccion: direccion ?? cliente.direccion,
        codPostal: codPostal ?? cliente.codPostal,
        localidad: localidad ?? cliente.localidad,
        provincia: provincia ?? cliente.provincia,
        fechaNacimiento: fechaNacimiento ?? cliente.fechaNacimiento,
        sexo: sexo ?? cliente.sexo,
      };
    });
  }

  private normalizeDni(dni: string): string {
    const trimmed = String(dni).trim();
    const withoutLeadingZeros = trimmed.replace(/^0+/, '');
    return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : trimmed;
  }

  private pickBestContactoByTipo(
    clienteFsa: ClientesFsaClienteDto | null,
    tipos: string[],
  ): string | null {
    type ContactoRaw = {
      tipo?: string | null;
      Tipo?: string | null;
      tipoContacto?: string | null;
      valor?: string | null;
      Valor?: string | null;
      value?: string | null;
      descripcion?: string | null;
      Descripcion?: string | null;
      esPrincipal?: boolean | string | number | null;
      principal?: boolean | string | number | null;
      Principal?: boolean | string | number | null;
      isPrimary?: boolean | string | number | null;
      estaVerificado?: boolean | string | number | null;
      verificado?: boolean | string | number | null;
      Verificado?: boolean | string | number | null;
      isVerified?: boolean | string | number | null;
    };

    const normalizedTipos = tipos.map((tipo) => tipo.trim().toUpperCase());
    const raw = clienteFsa as
      | (ClientesFsaClienteDto & { Contactos?: unknown[] })
      | null;
    const contactos = (clienteFsa?.contactos ??
      raw?.Contactos ??
      []) as ContactoRaw[];
    const candidates: Array<{ value: string; score: number; idx: number }> = [];

    for (const [idx, contacto] of contactos.entries()) {
      const contactoTipo = String(
        contacto?.tipo ?? contacto?.Tipo ?? contacto?.tipoContacto ?? '',
      )
        .trim()
        .toUpperCase();

      if (!normalizedTipos.includes(contactoTipo)) continue;

      const value = String(
        contacto?.valor ??
        contacto?.Valor ??
        contacto?.value ??
        contacto?.descripcion ??
        contacto?.Descripcion ??
        '',
      ).trim();

      if (!value) continue;

      const isPrincipal = this.toBoolean(
        contacto?.esPrincipal ??
        contacto?.principal ??
        contacto?.Principal ??
        contacto?.isPrimary,
      );
      const isVerificado = this.toBoolean(
        contacto?.estaVerificado ??
        contacto?.verificado ??
        contacto?.Verificado ??
        contacto?.isVerified,
      );

      const score = (isPrincipal ? 2 : 0) + (isVerificado ? 1 : 0);
      candidates.push({ value, score, idx });
    }

    candidates.sort((a, b) => b.score - a.score || a.idx - b.idx);
    return candidates[0]?.value ?? null;
  }

  private extractDireccion(
    clienteFsa: ClientesFsaClienteDto | null,
  ): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      Direccion?: string | null;
      domicilio?: {
        calle?: string | null;
        numero?: string | null;
      } | null;
      Domicilio?: {
        calle?: string | null;
        numero?: string | null;
      } | null;
    };

    const direct = String(raw.direccion ?? raw.Direccion ?? '').trim();
    if (direct) return direct;

    const domicilio = raw.domicilio ?? raw.Domicilio;
    const calle = String(domicilio?.calle ?? '').trim();
    const numero = String(domicilio?.numero ?? '').trim();
    const composed = [calle, numero].filter(Boolean).join(' ').trim();

    return composed || null;
  }

  private extractCodPostal(
    clienteFsa: ClientesFsaClienteDto | null,
  ): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      CodPostal?: string | null;
      domicilio?: { codPostal?: string | null } | null;
      Domicilio?: { codPostal?: string | null } | null;
    };

    const direct = String(raw.codPostal ?? raw.CodPostal ?? '').trim();
    if (direct) return direct;

    const domicilio = raw.domicilio ?? raw.Domicilio;
    const fromDomicilio = String(domicilio?.codPostal ?? '').trim();

    return fromDomicilio || null;
  }

  private extractLocalidad(
    clienteFsa: ClientesFsaClienteDto | null,
  ): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      Localidad?: string | null;
      domicilio?: { ciudad?: string | null } | null;
      Domicilio?: { ciudad?: string | null } | null;
    };

    const direct = String(raw.localidad ?? raw.Localidad ?? '').trim();
    if (direct) return direct;

    const domicilio = raw.domicilio ?? raw.Domicilio;
    const fromDomicilio = String(domicilio?.ciudad ?? '').trim();

    return fromDomicilio || null;
  }

  private extractProvincia(
    clienteFsa: ClientesFsaClienteDto | null,
  ): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      Provincia?: string | null;
      domicilio?: { provincia?: string | null } | null;
      Domicilio?: { provincia?: string | null } | null;
    };

    const direct = String(raw.provincia ?? raw.Provincia ?? '').trim();
    if (direct) return direct;

    const domicilio = raw.domicilio ?? raw.Domicilio;
    const fromDomicilio = String(domicilio?.provincia ?? '').trim();

    return fromDomicilio || null;
  }

  private extractFechaNacimiento(
    clienteFsa: ClientesFsaClienteDto | null,
  ): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      fecha_nacimiento?: string | null;
      fecNac?: string | null;
      FecNac?: string | null;
    };

    return (
      raw.fechaNacimiento ??
      raw.fecha_nacimiento ??
      raw.fecNac ??
      raw.FecNac ??
      null
    );
  }

  private normalizeFechaNacimiento(raw: string | null): string | null {
    if (!raw) return null;

    const value = String(raw).trim();
    if (!value) return null;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const latamMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (latamMatch) {
      return `${latamMatch[3]}-${latamMatch[2]}-${latamMatch[1]}`;
    }

    return null;
  }

  private extractSexo(clienteFsa: ClientesFsaClienteDto | null): string | null {
    if (!clienteFsa) return null;

    const raw = clienteFsa as ClientesFsaClienteDto & {
      Sexo?: string | null;
      genero?: string | null;
    };

    const sexo = String(raw.sexo ?? raw.Sexo ?? raw.genero ?? '')
      .trim()
      .toUpperCase();

    if (sexo === 'M' || sexo === 'F' || sexo === 'X') {
      return sexo;
    }

    return null;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value !== 'string') return false;

    const normalized = value.trim().toLowerCase();

    return normalized === 'true' || normalized === '1' || normalized === 'si';
  }
}
