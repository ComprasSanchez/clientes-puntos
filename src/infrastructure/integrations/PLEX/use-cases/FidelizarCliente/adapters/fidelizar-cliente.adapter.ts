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

@Injectable()
export class FidelizarClientePlexAdapter {
  constructor(
    @Inject(ClienteCreate)
    private readonly clienteCreate: ClienteCreate,
    @Inject(ClienteUpdate)
    private readonly clienteUpdate: ClienteUpdate,
  ) {}

  async handle(
    xml: string,
    ctx?: TransactionContext,
  ): Promise<UseCaseResponse> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsedObj = parser.parse(xml) as unknown;

    const plexDto = PlexFidelizarClienteRequestMapper.fromXml(parsedObj);

    let domainResponse: Cliente;

    switch (plexDto.codAccion as codFidelizarCliente) {
      case codFidelizarCliente.NUEVO:
      case codFidelizarCliente.TARJETA_VIRTUAL: {
        // NO pases idFidely (no lo requiere el input de create)
        const clienteRequest = {
          // NO idFidely aquí
          tarjetaFidely:
            (plexDto.codAccion as codFidelizarCliente) ===
            codFidelizarCliente.REEMPLAZAR_TARJETA
              ? plexDto.nroTarjetaAnterior
              : plexDto.nroTarjeta,
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
        domainResponse = await this.clienteCreate.run(
          clienteRequest,
          (plexDto.codAccion as codFidelizarCliente) ===
            codFidelizarCliente.TARJETA_VIRTUAL,
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
        // idFidely es requerido y seguro en este caso
        const clienteRequest = {
          idFidely: Number(plexDto.idClienteFidely),
          tarjetaFidely:
            (plexDto.codAccion as codFidelizarCliente) ===
            codFidelizarCliente.REEMPLAZAR_TARJETA
              ? plexDto.nroTarjetaAnterior
              : plexDto.nroTarjeta,
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
        domainResponse = await this.clienteUpdate.run(clienteRequest, ctx);
        break;
      }

      default:
        throw new Error(`CodAccion desconocido: ${plexDto.codAccion}`);
    }

    const response = PlexFidelizarClienteResponseMapper.fromDomain({
      idClienteFidely: domainResponse.fidelyStatus.idFidely.value!.toString(),
      nroTarjeta: domainResponse.fidelyStatus.tarjetaFidely.value,
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
  }
}
