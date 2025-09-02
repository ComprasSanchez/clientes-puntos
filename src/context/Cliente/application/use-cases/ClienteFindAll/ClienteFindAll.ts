import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindAll {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  async run(): Promise<ClienteResponseDto[]> {
    const clientes = await this.repository.findAll();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      // Siempre devolvés un array vacío, nunca null ni undefined
      return [];
    }

    const mapped: ClienteResponseDto[] = clientes.map((c) => ({
      id: c.id.value,
      dni: c.dni.value,
      nombre: c.nombre.value,
      apellido: c.apellido.value,
      sexo: c.sexo.value,
      fechaNacimiento:
        c.fechaNacimiento && c.fechaNacimiento.value
          ? c.fechaNacimiento.value.toISOString().split('T')[0]
          : null,
      status: c.status.value,
      categoria: c.categoria.codExt!,
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      idFidely: c.fidelyStatus.idFidely.value,
      email: c.email.value,
      telefono: c.telefono.value,
      direccion: c.fullAdress.direccion.value,
      codPostal: c.fullAdress.codPostal.value,
      localidad: c.fullAdress.localidad.value,
      provincia: c.fullAdress.provincia.value,
      fechaBaja: c.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    }));

    return mapped;
  }
}
