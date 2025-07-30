import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { js2xml, xml2js } from 'xml-js';
import { PlexFidelizarClienteRequestMapper } from '../dtos/fidelizar-cliente.request.dto';
import { codFidelizarCliente } from '@infrastructure/integrations/PLEX/enums/fidelizar-cliente.enum';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { PlexFidelizarClienteResponseMapper } from '../dtos/fidelizar-cliente.response.dto';

@Injectable()
export class FidelizarClientePlexAdapter {
  constructor(
    @Inject(ClienteCreate)
    private readonly clienteCreate: ClienteCreate,
    @Inject(ClienteUpdate)
    private readonly clienteUpdate: ClienteUpdate,
  ) {}

  async handle(xml: string, ctx?: TransactionContext): Promise<string> {
    // 1. Parseo XML
    const parsedObj = xml2js(xml, { compact: true });

    // 2. DTO integración
    const plexDto = PlexFidelizarClienteRequestMapper.fromXml(parsedObj);

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

    let domainResponse: Cliente;

    switch (plexDto.codAccion as codFidelizarCliente) {
      case codFidelizarCliente.NUEVO:
        domainResponse = await this.clienteCreate.run(
          clienteRequest,
          false,
          ctx,
        );
        break;
      case codFidelizarCliente.MODIFICAR:
        domainResponse = await this.clienteUpdate.run(clienteRequest, ctx);
        break;
      case codFidelizarCliente.REEMPLAZAR_TARJETA:
        domainResponse = await this.clienteUpdate.run(clienteRequest, ctx);
        break;
      case codFidelizarCliente.TARJETA_VIRTUAL:
        domainResponse = await this.clienteCreate.run(
          clienteRequest,
          true,
          ctx,
        );
        break;
      default:
        throw new Error(`CodAccion desconocido: ${plexDto.codAccion}`);
    }

    const response = PlexFidelizarClienteResponseMapper.fromDomain({
      idClienteFidely: domainResponse.fidelyStatus.idFidely.value!.toString(),
      nroTarjeta: domainResponse.fidelyStatus.tarjetaFidely.value,
    });

    const xmlResponse = PlexFidelizarClienteResponseMapper.toXml(response);

    return js2xml(xmlResponse, {
      compact: true,
      spaces: 2,
    });
  }
}
