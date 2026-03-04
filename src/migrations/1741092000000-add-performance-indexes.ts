import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1741092000000 implements MigrationInterface {
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_transacciones_operation_id" ON "transacciones" ("operationId")',
    );
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_transacciones_referencia_id" ON "transacciones" ("referenciaId")',
    );
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_lotes_cliente_created_at" ON "lotes" ("clienteId", "createdAt")',
    );
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_operaciones_ref_operacion" ON "operaciones" ("refOperacion")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "idx_operaciones_ref_operacion"',
    );
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "idx_lotes_cliente_created_at"',
    );
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "idx_transacciones_referencia_id"',
    );
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "idx_transacciones_operation_id"',
    );
  }
}
