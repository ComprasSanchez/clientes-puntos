import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { ClienteResponseDto } from '../dtos/ClienteResponseDto';

@Injectable()
export class ClienteCanonicalHydrator {
  private readonly logger = new Logger(ClienteCanonicalHydrator.name);

  constructor(
    @Inject(ClientesFsaClient)
    private readonly clientesPort: ClientesFsaClient,
  ) {}

  async enrichOne(cliente: ClienteResponseDto): Promise<ClienteResponseDto> {
    try {
      const canonical =
        (await this.clientesPort.findByExternalId('PUNTOS', cliente.id)) ??
        (await this.clientesPort.findByDni(cliente.dni));

      if (!canonical) return cliente;

      const domicilio = canonical.domicilio ?? null;

      return {
        ...cliente,
        nombre: canonical.nombre ?? cliente.nombre,
        apellido: canonical.apellido ?? cliente.apellido,
        sexo: canonical.sexo ?? cliente.sexo,
        fechaNacimiento: canonical.fechaNacimiento ?? cliente.fechaNacimiento,
        email: canonical.email ?? cliente.email,
        telefono: canonical.telefono ?? cliente.telefono,
        direccion:
          canonical.direccion ??
          (domicilio?.calle ? String(domicilio.calle) : cliente.direccion),
        codPostal:
          canonical.codPostal ?? domicilio?.codPostal ?? cliente.codPostal,
        localidad:
          canonical.localidad ?? domicilio?.ciudad ?? cliente.localidad,
        provincia:
          canonical.provincia ?? domicilio?.provincia ?? cliente.provincia,
      };
    } catch (error) {
      this.logger.warn(
        {
          clienteId: cliente.id,
          dni: cliente.dni,
          error: error instanceof Error ? error.message : String(error),
        },
        'No se pudo hidratar cliente con datos canonicos',
      );
      return cliente;
    }
  }

  async enrichMany(
    clientes: ClienteResponseDto[],
  ): Promise<ClienteResponseDto[]> {
    return Promise.all(clientes.map((cliente) => this.enrichOne(cliente)));
  }
}
