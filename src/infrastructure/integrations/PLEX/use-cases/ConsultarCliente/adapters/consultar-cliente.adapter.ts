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
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { ClientesFsaClienteDto } from '@infrastructure/integrations/CLIENTES/dto/clientes-fsa.dto';

@Injectable()
export class ConsultarClientePlexAdapter {
  constructor(
    @Inject(ClienteFindByTarjeta)
    private readonly findByTarjeta: ClienteFindByTarjeta,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly saldoService: ObtenerSaldo,
    @Inject(ReglaFindCotizacion)
    private readonly getCotizacion: ReglaFindCotizacion,
    @Inject(ClientesFsaClient)
    private readonly clientesFsaClient: ClientesFsaClient,
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

    const clienteFsaBase =
      (await this.clientesFsaClient.findById(domainResponse.id)) ??
      (await this.clientesFsaClient.findByDni(domainResponse.dni));
    const clienteFsa = clienteFsaBase?.id
      ? ((await this.clientesFsaClient.findProfileById(clienteFsaBase.id)) ??
        clienteFsaBase)
      : clienteFsaBase;

    const cotizacion = await this.getCotizacion.run();

    const valorPorPunto = valorPuntoEnPesos(cotizacion.rateSpendVo.value);
    const emailContacto = this.pickBestContactoByTipo(clienteFsa, ['EMAIL']);
    const telefonoContacto = this.pickBestContactoByTipo(clienteFsa, [
      'TELEFONO',
    ]);
    const direccionCliente = this.extractDireccion(clienteFsa);
    const codPostalCliente = this.extractCodPostal(clienteFsa);
    const fechaNacimiento =
      this.normalizeFechaNacimiento(this.extractFechaNacimiento(clienteFsa)) ??
      domainResponse.fechaNacimiento;

    const dto = PlexConsultarClienteResponseMapper.fromDomain({
      idClienteFidely: domainResponse.idFidely!.toString(),
      campania: process.env.CAMPANIA_ID!,
      categoria: domainResponse.categoria,
      nombre: clienteFsa?.nombre ?? domainResponse.nombre ?? 'SIN_DATO',
      apellido: clienteFsa?.apellido ?? domainResponse.apellido ?? 'SIN_DATO',
      fecNac: fechaNacimiento,
      dni: clienteFsa?.documento?.numero ?? domainResponse.dni,
      telefono: domainResponse.telefono,
      celular:
        telefonoContacto ?? clienteFsa?.telefono ?? domainResponse.telefono,
      direccion: direccionCliente ?? domainResponse.direccion,
      email: emailContacto ?? clienteFsa?.email ?? domainResponse.email,
      sexo: domainResponse.sexo,
      codPostal: codPostalCliente ?? domainResponse.codPostal,
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

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;

    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();

    return normalized === 'true' || normalized === '1' || normalized === 'si';
  }
}
