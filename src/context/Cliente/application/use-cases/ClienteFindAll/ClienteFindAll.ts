import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteFindAll {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
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
      nombre: null,
      apellido: null,
      sexo: null,
      fechaNacimiento: null,
      status: c.status.value,
      categoria: c.categoria.codExt!,
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      idFidely: c.fidelyStatus.idFidely.value,
      email: null,
      telefono: null,
      direccion: null,
      codPostal: null,
      localidad: null,
      provincia: null,
      fechaBaja: c.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    }));

    return this.canonicalHydrator.enrichMany(mapped);
  }
}
