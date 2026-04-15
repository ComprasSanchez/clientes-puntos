import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { PlexFidelizarClienteRequestMapper } from '../dtos/fidelizar-cliente.request.dto';
import { codFidelizarCliente } from '@infrastructure/integrations/PLEX/enums/fidelizar-cliente.enum';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { PlexFidelizarClienteResponseMapper } from '../dtos/fidelizar-cliente.response.dto';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { ClientesSyncFromPuntosService } from '@infrastructure/integrations/CLIENTES/services/clientes-sync-from-puntos.service';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { ClientesFsaUpsertVerificacionRequest } from '@infrastructure/integrations/CLIENTES/dto/clientes-fsa.dto';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';

@Injectable()
export class FidelizarClientePlexAdapter {
  constructor(
    @Inject(ClienteCreate)
    private readonly clienteCreate: ClienteCreate,
    @Inject(ClienteUpdate)
    private readonly clienteUpdate: ClienteUpdate,
    @Inject(ClientesFsaClient)
    private readonly clientesFsaClient: ClientesFsaClient,
    @Inject(ClientesSyncFromPuntosService)
    private readonly clientesSyncFromPuntos: ClientesSyncFromPuntosService,
    @Inject(CLIENTE_REPO)
    private readonly clienteRepository: ClienteRepository,
  ) { }

  async handle(
    xml: string,
    ctx?: TransactionContext,
  ): Promise<UseCaseResponse> {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true,
      });
      const parsedObj = parser.parse(xml) as unknown;

      const plexDto = PlexFidelizarClienteRequestMapper.fromXml(parsedObj);

      await this.clientesFsaClient.upsertVerificacion(
        this.toClientesFsaUpsertPayload(plexDto),
      );

      let domainResponse: Cliente;

      switch (plexDto.codAccion as codFidelizarCliente) {
        case codFidelizarCliente.NUEVO:
        case codFidelizarCliente.TARJETA_VIRTUAL: {
          const existingByDni = await this.clienteRepository.findByDni(
            new ClienteDni(plexDto.dni),
          );
          if (existingByDni) {
            throw new Error(
              `DNI ${plexDto.dni} ya existe; para actualizar use codAccion 101 o 102`,
            );
          }

          // No enviar tarjetaFidely ni idFidely: el caso de uso decide la tarjeta,
          // y la DB autogenera id_fidely si corresponde.
          const clienteRequest: any = {
            dni: plexDto.dni,
            nombre: plexDto.nombre,
            apellido: plexDto.apellido,
            sexo: plexDto.sexo!,
            fechaNacimiento: new Date(plexDto.fecNac!),
            categoria: plexDto.categoria,
            email: plexDto.email,
            telefono: plexDto.telefono,
            direccion: plexDto.direccion,
            codPostal: plexDto.codPostal,
            localidad: plexDto.localidad,
            provincia: plexDto.provincia,
          };
          // Solo incluir idFidely si viene en el request y es válido
          if (
            plexDto.idClienteFidely !== undefined &&
            plexDto.idClienteFidely !== null &&
            String(plexDto.idClienteFidely).trim() !== ''
          ) {
            clienteRequest.idFidely = Number(plexDto.idClienteFidely);
          }

          // Flag: en TARJETA_VIRTUAL la tarjeta = DNI; en NUEVO se genera.
          const tarjetaConDni =
            (plexDto.codAccion as codFidelizarCliente) ===
            codFidelizarCliente.TARJETA_VIRTUAL;

          domainResponse = await this.clienteCreate.run(
            clienteRequest,
            tarjetaConDni,
            ctx,
          );
          break;
        }

        case codFidelizarCliente.MODIFICAR:
        case codFidelizarCliente.REEMPLAZAR_TARJETA: {
          if (!plexDto.idClienteFidely) {
            throw new Error(
              'IDClienteFidely es requerido para modificar o reemplazar tarjeta',
            );
          }

          // En update sí puede venir idFidely y también una tarjeta explícita
          const clienteRequest: any = {
            idFidely: Number(plexDto.idClienteFidely),
            dni: plexDto.dni,
            nombre: plexDto.nombre,
            apellido: plexDto.apellido,
            sexo: plexDto.sexo!,
            fechaNacimiento: new Date(plexDto.fecNac!),
            categoria: plexDto.categoria,
            email: plexDto.email,
            telefono: plexDto.telefono,
            direccion: plexDto.direccion,
            codPostal: plexDto.codPostal,
            localidad: plexDto.localidad,
            provincia: plexDto.provincia,
          };

          if (plexDto.nroTarjeta) {
            clienteRequest.tarjetaFidely = plexDto.nroTarjeta;
          }

          domainResponse = await this.clienteUpdate.run(clienteRequest, ctx);
          break;
        }

        default:
          throw new Error(`CodAccion desconocido: ${plexDto.codAccion}`);
      }

      const puntosId = domainResponse.id.value;
      const dni = domainResponse.dni.value;

      // Llamada al MS de clientes (axios) para vincular PUNTOS ←→ Clientes
      void this.clientesSyncFromPuntos.notifyClienteFidelizado({
        puntosId,
        dni,
      });

      const idFidely = domainResponse.fidelyStatus.idFidely.value;
      const tarjetaFidely = domainResponse.fidelyStatus.tarjetaFidely.value;

      if (idFidely === undefined || idFidely === null) {
        throw new Error('DEBUG_ERROR: idFidely is NULL or UNDEFINED');
      }

      if (!tarjetaFidely) {
        throw new Error('DEBUG_ERROR: tarjetaFidely is NULL or EMPTY');
      }

      const response = PlexFidelizarClienteResponseMapper.fromDomain({
        idClienteFidely: idFidely.toString(),
        nroTarjeta: tarjetaFidely.toString(),
      });

      const xmlResponseObj = PlexFidelizarClienteResponseMapper.toXml(response);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
      });
      const xmlString = builder.build(xmlResponseObj);

      return {
        response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
        dto: response,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`[ADAPTER_CRASH] ${error.message} \nStack: ${error.stack}`);
      }
      throw error;
    }
  }

  private toClientesFsaUpsertPayload(dto: {
    dni: string;
    nombre: string;
    apellido: string;
    sexo?: string;
    fecNac?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    codPostal?: string;
    localidad?: string;
    provincia?: string;
  }): ClientesFsaUpsertVerificacionRequest {
    const domicilio = dto.direccion
      ? {
        calle: dto.direccion,
        ciudad: dto.localidad ?? 'N/D',
        provincia: dto.provincia ?? 'N/D',
        codPostal: dto.codPostal,
      }
      : null;

    return {
      tipoDocumento: 'DNI',
      nroDocumento: dto.dni,
      nombre: dto.nombre,
      apellido: dto.apellido,
      sexo: this.normalizeSexo(dto.sexo),
      fechaNacimiento: this.normalizeFechaNacimiento(dto.fecNac),
      email: dto.email,
      telefono: dto.telefono,
      domicilio,
    };
  }

  private normalizeSexo(sexo?: string): 'M' | 'F' | 'X' | null {
    const normalized = (sexo ?? '').trim().toUpperCase();
    if (normalized === 'M' || normalized === 'F' || normalized === 'X') {
      return normalized;
    }
    return null;
  }

  private normalizeFechaNacimiento(raw?: string): string | null {
    const value = (raw ?? '').trim();
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;

    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
}
