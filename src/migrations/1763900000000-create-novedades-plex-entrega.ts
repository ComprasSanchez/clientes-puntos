import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marca de entrega de novedades a Plex, por consumidor (codigoExt del token).
 *
 * Plex pide novedades siempre desde la misma FechaDesde (no la avanza), así
 * que cada respuesta traía todo lo acumulado (~35k clientes, ~36 MB). Guardamos
 * hasta qué cliente le entregamos completo (novedad_plex_at + id, con precisión
 * de microsegundos) y la próxima respuesta arranca desde ahí, de a tandas.
 */
export class CreateNovedadesPlexEntrega1763900000000
  implements MigrationInterface
{
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS novedades_plex_entrega (
        consumidor varchar(64) PRIMARY KEY,
        entregado_hasta timestamptz NOT NULL,
        entregado_hasta_cliente_id uuid NOT NULL,
        actualizado_en timestamptz NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS novedades_plex_entrega`);
  }
}
