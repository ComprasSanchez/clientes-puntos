/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/context/Regla/infrastructure/adapters/TypeOrmReglaRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regla as ReglaDomain } from '../../../core/entities/Regla';
import { ReglaRepository } from 'src/context/Regla/core/repository/ReglaRepository';
import { ReglaEntity } from '../../entities/regla.entity';
import { ReglaCriteria } from 'src/context/Regla/core/entities/Criteria';
import { ConversionRuleEntity } from '@regla/infrastructure/entities/rule-conversion.entity';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { TipoRegla } from '@regla/core/enums/TipoRegla';

@Injectable()
export class TypeOrmReglaRepository implements ReglaRepository {
  constructor(
    @InjectRepository(ReglaEntity)
    private readonly repo: Repository<ReglaEntity>,
  ) {}

  /**
   * Recupera una regla por su ID.
   */
  async findById(id: string): Promise<ReglaDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? entity.toDomain() : null;
  }

  /**
   * Recupera las reglas que cumplen los criterios.
   */
  async findByCriteria(criteria: ReglaCriteria): Promise<ReglaDomain[]> {
    const qb = this.repo.createQueryBuilder('r');

    // Filtrar por tipo de regla
    if (criteria.tipo) {
      qb.andWhere('r.tipo = :tipo', { tipo: criteria.tipo });
    }
    // Solo reglas activas
    qb.andWhere('r.activa = :activa', { activa: true });

    // Filtrar por vigencia
    if (criteria.fecha) {
      qb.andWhere('r.vigenciaInicio <= :fecha', {
        fecha: criteria.fecha.value,
      }).andWhere('(r.vigenciaFin IS NULL OR r.vigenciaFin >= :fecha)', {
        fecha: criteria.fecha.value,
      });
    }

    // Ordenar por prioridad
    qb.orderBy('r.prioridad', 'ASC');

    const entities = await qb.getMany();
    return entities.map((e) => e.toDomain());
  }

  /**
   * Persiste una regla en la base de datos.
   */
  async save(regla: ReglaDomain): Promise<void> {
    let entity: ReglaEntity;
    switch (regla.tipo.value) {
      case TipoRegla.CONVERSION:
        entity = ConversionRuleEntity.fromDomain(regla as ConversionRule);
        break;
      // … otros tipos aquí …
      default:
        throw new Error(`Tipo de regla no soportado: ${regla.tipo.value}`);
    }
    await this.repo.save(entity);
  }
}
