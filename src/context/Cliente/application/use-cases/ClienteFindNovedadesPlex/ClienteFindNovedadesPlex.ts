import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

/**
 * Clientes publicados como novedad para Plex en el rango pedido.
 * Filtra por novedad_plex_at (lo pone ClienteLiberarNovedadesPlex de a lotes),
 * no por updated_at: así un cambio masivo no viaja entero en una respuesta.
 */
@Injectable()
export class ClienteFindNovedadesPlex {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  async run(
    params: { from: Date; to: Date },
    options?: { skipCanonicalHydration?: boolean },
  ): Promise<ClienteResponseDto[]> {
    const clientes = await this.repository.findNovedadesPlexBetween(params);

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return [];
    }

    const mapped = clientes.map((c) => ({
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

    if (options?.skipCanonicalHydration) {
      return mapped;
    }

    return this.canonicalHydrator.enrichMany(mapped);
  }
}
