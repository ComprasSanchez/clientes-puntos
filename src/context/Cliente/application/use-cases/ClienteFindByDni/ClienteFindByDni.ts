// @cliente/application/use-cases/ClienteFindByDni.ts

import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteFindByDni {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  /**
   * Busca un Cliente por su DNI.
   * Lanza ClienteNotFoundError si no existe.
   */
  async run(dni: string): Promise<ClienteResponseDto> {
    const dniVo = new ClienteDni(dni);
    const cliente = await this.repository.findByDni(dniVo);

    if (!cliente) {
      throw new ClienteNotFoundError(dni);
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
