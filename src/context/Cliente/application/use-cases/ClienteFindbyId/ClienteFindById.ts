import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteFindById {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  async run(id: string): Promise<ClienteResponseDto | null> {
    const cliente = await this.repository.findById(new ClienteId(id));

    if (!cliente) {
      throw new ClienteNotFoundError(id);
    }

    const mapped: ClienteResponseDto = {
      id: cliente.id.value,
      dni: cliente.dni.value,
      nombre: null,
      apellido: null,
      sexo: null,
      fechaNacimiento: null,
      status: cliente.status.value,
      categoria: cliente.categoria.codExt!,
      email: null,
      telefono: null,
      direccion: null,
      codPostal: null,
      localidad: null,
      provincia: null,
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };

    return this.canonicalHydrator.enrichOne(mapped);
  }
}
