// @cliente/application/use-cases/ClienteFindByDni.ts

import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindByDni {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
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
      nombre: cliente.nombre.value,
      apellido: cliente.apellido.value,
      sexo: cliente.sexo.value,
      fechaNacimiento: cliente.fechaNacimiento.value
        ? cliente.fechaNacimiento.value.toISOString().split('T')[0]
        : null, // O '', según lo que decidas para el tipo
      status: cliente.status.value,
      categoria: cliente.categoria.nombre.value,
      email: cliente.email.value,
      telefono: cliente.telefono.value,
      direccion: cliente.fullAdress.direccion.value,
      codPostal: cliente.fullAdress.codPostal.value,
      localidad: cliente.fullAdress.localidad.value,
      provincia: cliente.fullAdress.provincia.value,
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };

    return mapped;
  }
}
