// @cliente/application/use-cases/ClienteFindByDni.ts

import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindByTarjeta {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
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
      nombre: cliente.nombre.value,
      apellido: cliente.apellido.value,
      sexo: cliente.sexo.value,
      fechaNacimiento: cliente.fechaNacimiento.value
        ? cliente.fechaNacimiento.value.toISOString().split('T')[0]
        : null, // O '', según lo que decidas para el tipo
      status: cliente.status.value,
      categoria: cliente.categoria.codExt!,
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      email: cliente.email.value,
      telefono: cliente.telefono.value,
      direccion: cliente.fullAdress.direccion.value,
      codPostal: cliente.fullAdress.codPostal.value,
      localidad: cliente.fullAdress.localidad.value,
      provincia: cliente.fullAdress.provincia.value,
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };

    return mapped;
  }
}
