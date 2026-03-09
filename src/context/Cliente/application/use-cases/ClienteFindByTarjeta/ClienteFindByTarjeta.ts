// @cliente/application/use-cases/ClienteFindByDni.ts

import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteFindByTarjeta {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  /**
   * Busca un Cliente por su DNI.
   * Lanza ClienteNotFoundError si no existe.
   */
  async run(nroTarjeta: string): Promise<ClienteResponseDto> {
    const tarjetaVO = new ClienteTarjetaFidely(nroTarjeta);
    const cliente = await this.repository.findByNroTarjeta(tarjetaVO);

    if (!cliente) {
      throw new ClienteNotFoundError(nroTarjeta);
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
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      email: null,
      telefono: null,
      direccion: null,
      codPostal: null,
      localidad: null,
      provincia: null,
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };

    return this.canonicalHydrator.enrichOne(mapped);
  }
}
