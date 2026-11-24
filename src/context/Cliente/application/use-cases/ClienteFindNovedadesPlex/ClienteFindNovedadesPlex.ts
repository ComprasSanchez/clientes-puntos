import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

export type NovedadesPlexTanda = {
  clientes: ClienteResponseDto[];
  /** Último cliente de la tanda: se marca como entregado si la respuesta sale completa. */
  ultimoClienteId: string | null;
  /** Quedaron clientes afuera por el tope: van en la próxima consulta. */
  hayMas: boolean;
};

/**
 * Novedades para Plex: clientes con novedad_plex_at en el rango pedido, a
 * partir de lo último que ya se le entregó a ese consumidor, de a `limite`.
 *
 * Plex manda siempre la misma FechaDesde; sin la marca de entrega cada
 * respuesta repetía todo lo acumulado.
 */
@Injectable()
export class ClienteFindNovedadesPlex {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  async run(
    params: { consumidor: string; from: Date; to: Date; limite: number },
    options?: { skipCanonicalHydration?: boolean },
  ): Promise<NovedadesPlexTanda> {
    const { clientes, ultimoClienteId, hayMas } =
      await this.repository.findNovedadesPlexParaEntregar(params);

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return { clientes: [], ultimoClienteId: null, hayMas: false };
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

    return {
      clientes: options?.skipCanonicalHydration
        ? mapped
        : await this.canonicalHydrator.enrichMany(mapped),
      ultimoClienteId,
      hayMas,
    };
  }
}
