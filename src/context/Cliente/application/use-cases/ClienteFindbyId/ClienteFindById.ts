import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindById {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  async run(id: string): Promise<ClienteResponseDto | null> {
    const cliente = await this.repository.findById(new ClienteId(id));

    if (!cliente) {
      throw new ClienteNotFoundError(id);
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
