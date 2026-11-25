import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ClienteLiberarNovedadesPlex } from '@cliente/application/use-cases/ClienteLiberarNovedadesPlex/ClienteLiberarNovedadesPlex';
import { NOVEDADES_PLEX_MAX_CLIENTES } from '@cliente/application/novedades-plex.config';

const LOTE_DEFAULT = 500;

/**
 * Cada minuto publica como novedad para Plex un lote de clientes con cambios
 * pendientes. Es lo que limita cuántos clientes recibe Plex por consulta.
 *
 * NOVEDADES_PLEX_ENABLED (default true): apagarlo frena las novedades a Plex.
 * NOVEDADES_PLEX_LOTE (default 500): clientes por minuto.
 * NOVEDADES_PLEX_CRON (default cada minuto): se lee al arrancar.
 */
@Injectable()
export class NovedadesPlexCron {
  private readonly logger = new Logger(NovedadesPlexCron.name);
  private isRunning = false;

  constructor(
    private readonly liberarNovedades: ClienteLiberarNovedadesPlex,
    private readonly config: ConfigService,
  ) {}

  @Cron(process.env.NOVEDADES_PLEX_CRON ?? '* * * * *', {
    timeZone: 'America/Argentina/Cordoba',
  })
  async liberar(): Promise<void> {
    const enabled = (
      this.config.get<string>('NOVEDADES_PLEX_ENABLED') ?? 'true'
    )
      .trim()
      .toLowerCase();
    if (enabled === 'false' || enabled === '0' || enabled === 'no') return;

    if (this.isRunning) {
      this.logger.warn(
        'Novedades Plex: la corrida anterior sigue en curso, se saltea',
      );
      return;
    }

    const loteRaw = Number(this.config.get<string>('NOVEDADES_PLEX_LOTE'));
    const lote =
      Number.isInteger(loteRaw) && loteRaw > 0 ? loteRaw : LOTE_DEFAULT;

    this.isRunning = true;
    try {
      const { liberados, sinEntregar } = await this.liberarNovedades.run(lote);
      if (liberados > 0) {
        this.logger.log(
          { liberados, lote, sinEntregar },
          'Novedades Plex liberadas',
        );
      } else if (sinEntregar >= NOVEDADES_PLEX_MAX_CLIENTES) {
        this.logger.log(
          { sinEntregar, max: NOVEDADES_PLEX_MAX_CLIENTES },
          'Novedades Plex: en espera, Plex todavía no recibió lo ya publicado',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Novedades Plex: falló la liberación: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
