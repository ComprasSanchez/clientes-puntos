// ajuste/infrastructure/typeorm/AjusteTypeOrmRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ajuste } from '@puntos/core/entities/Ajuste';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';
import { AjusteEntity } from '@puntos/infrastructure/entities/ajuste.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AjusteTypeOrmRepository implements AjusteRepository {
  constructor(
    @InjectRepository(AjusteEntity)
    private readonly repo: Repository<AjusteEntity>,
  ) {}

  async save(ajuste: Ajuste): Promise<void> {
    const entity = this.repo.create({
      id: ajuste.id,
      usuarioId: ajuste.usuarioId,
      clienteId: ajuste.clienteId,
      tipo: ajuste.tipo,
      cantidad: ajuste.cantidad,
      motivo: ajuste.motivo,
      fecha: ajuste.fecha,
    });
    await this.repo.save(entity);
  }
}
