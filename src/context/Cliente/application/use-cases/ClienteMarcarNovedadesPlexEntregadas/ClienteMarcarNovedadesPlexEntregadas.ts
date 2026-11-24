import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';

/**
 * Avanza hasta dónde se le entregaron novedades a un consumidor de Plex.
 * Solo se llama cuando la respuesta salió completa: si se corta, la próxima
 * consulta vuelve a traer la misma tanda.
 */
@Injectable()
export class ClienteMarcarNovedadesPlexEntregadas {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  async run(consumidor: string, ultimoClienteId: string): Promise<void> {
    await this.repository.marcarNovedadesPlexEntregadas(
      consumidor,
      ultimoClienteId,
    );
  }
}
