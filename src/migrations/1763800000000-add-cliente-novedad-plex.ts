import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fila de novedades para Plex.
 *
 * Antes ConsultarNovedadesCliente devolvía todo cliente con updated_at en el
 * rango pedido: cualquier cambio masivo viajaba entero a Plex en una sola
 * respuesta. Ahora los cambios quedan pendientes (novedad_plex_pendiente_desde)
 * y un proceso los libera de a lotes poniendo novedad_plex_at, que es lo que
 * filtra novedades.
 *
 * novedad_plex_at arranca igual a updated_at para que un rango ya consultado
 * por Plex devuelva lo mismo que antes del cambio.
 */
export class AddClienteNovedadPlex1763800000000 implements MigrationInterface {
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cliente
        ADD COLUMN IF NOT EXISTS novedad_plex_at timestamp with time zone NULL,
        ADD COLUMN IF NOT EXISTS novedad_plex_pendiente_desde timestamp with time zone NULL
    `);

    await queryRunner.query(`
      UPDATE cliente
      SET novedad_plex_at = updated_at
      WHERE novedad_plex_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cliente_novedad_plex_at
      ON cliente (novedad_plex_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cliente_novedad_plex_pendiente
      ON cliente (novedad_plex_pendiente_desde)
      WHERE novedad_plex_pendiente_desde IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_cliente_novedad_plex_pendiente`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cliente_novedad_plex_at`);
    await queryRunner.query(`
      ALTER TABLE cliente
        DROP COLUMN IF EXISTS novedad_plex_pendiente_desde,
        DROP COLUMN IF EXISTS novedad_plex_at
    `);
  }
}
