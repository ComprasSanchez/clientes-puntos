// @regla/infrastructure/adapters/TypeOrmReglaRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regla as ReglaDomain } from '../../../core/entities/Regla';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { ReglaEntity } from '../../entities/regla.entity';
import { ReglaCriteria } from '@regla/core/entities/Criteria';
import { ConversionRuleEntity } from '@regla/infrastructure/entities/rule-conversion.entity';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { TipoRegla } from '@regla/core/enums/TipoRegla';

@Injectable()
export class TypeOrmReglaRepository implements ReglaRepository {
  constructor(
    @InjectRepository(ReglaEntity)
    private readonly repo: Repository<ReglaEntity>,
    @InjectRepository(ConversionRuleEntity)
    private readonly conversionRuleRepo: Repository<ConversionRuleEntity>,
  ) {}

  async findById(id: string): Promise<ReglaDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? entity.toDomain() : null;
  }

  async findByCriteria(criteria: ReglaCriteria): Promise<ReglaDomain[]> {
    const qb = this.repo.createQueryBuilder('r');
    qb.andWhere('r.activa = :activa', { activa: true });
    if (criteria.fecha) {
      qb.andWhere('r.vigenciaInicio <= :fecha', {
        fecha: criteria.fecha.value,
      }).andWhere('(r.vigenciaFin IS NULL OR r.vigenciaFin >= :fecha)', {
        fecha: criteria.fecha.value,
      });
    }
    qb.orderBy('r.prioridad', 'ASC');
    const entities = await qb.getMany();
    return entities.map((e) => e.toDomain());
  }

  async findAll(): Promise<ReglaDomain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => e.toDomain());
  }

  async save(regla: ReglaDomain): Promise<void> {
    let ent: ReglaEntity;
    switch (regla.tipo.value) {
      case TipoRegla.CONVERSION:
        ent = ConversionRuleEntity.fromDomain(regla as ConversionRule);
        ent.tipo = TipoRegla.CONVERSION;
        break;
      default:
        throw new Error(`Tipo de regla no soportado: ${regla.tipo.value}`);
    }
    if (ent instanceof ConversionRuleEntity) {
      await this.conversionRuleRepo.save(ent);
    } else {
      // Si tuvieras otras entidades hijas, usarías su repositorio específico aquí
      // O podrías tener un mapeo de TipoRegla a repositorios específicos
      await this.repo.save(ent); // Esto solo se usaría para la entidad base si se pudiera instanciar directamente
    }
  }

  async update(regla: ReglaDomain): Promise<void> {
    // Utiliza el save, que en TypeORM actualiza si el id existe
    await this.save(regla);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
