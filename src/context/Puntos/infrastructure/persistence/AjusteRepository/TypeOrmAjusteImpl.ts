// ajuste/infrastructure/typeorm/AjusteTypeOrmRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ajuste } from '@puntos/core/entities/Ajuste';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';
import { AjusteEntity } from '@puntos/infrastructure/entities/ajuste.entity';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TypeOrmTransactionContext } from '@shared/infrastructure/transaction/TypeOrmTransactionContext';
import { Repository } from 'typeorm';

@Injectable()
export class AjusteTypeOrmRepository implements AjusteRepository {
  constructor(
    @InjectRepository(AjusteEntity)
    private readonly repo: Repository<AjusteEntity>,
  ) {}

  // Dentro de la transacción de la operación, si la hay.
  private repoDe(ctx?: TransactionContext): Repository<AjusteEntity> {
    return ctx instanceof TypeOrmTransactionContext
      ? ctx.manager.getRepository(AjusteEntity)
      : this.repo;
  }

  async save(ajuste: Ajuste, ctx?: TransactionContext): Promise<void> {
    const repo = this.repoDe(ctx);
    const entity = repo.create({
      id: ajuste.id,
      usuarioId: ajuste.usuarioId,
      clienteId: ajuste.clienteId,
      tipo: ajuste.tipo,
      cantidad: ajuste.cantidad,
      motivo: ajuste.motivo,
      fecha: ajuste.fecha,
      claveExterna: ajuste.claveExterna ?? null,
    });
    await repo.save(entity);
  }

  async findByClaveExterna(
    claveExterna: string,
    ctx?: TransactionContext,
  ): Promise<Ajuste | null> {
    const row = await this.repoDe(ctx).findOne({ where: { claveExterna } });
    return row
      ? new Ajuste(
          row.id,
          row.usuarioId,
          row.clienteId,
          row.tipo,
          row.cantidad,
          row.fecha,
          row.motivo ?? undefined,
          row.claveExterna ?? undefined,
        )
      : null;
  }
}
