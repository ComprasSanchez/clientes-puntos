// src/infrastructure/database/repositories/integracion-movimiento.repository.ts
import { Repository } from 'typeorm';
import { IntegracionMovimientoEntity } from '../entities/integracion-movimiento.entity';

// Si usas TypeORM >= 0.3.x, el @EntityRepository ya no se usa, sino un custom provider o el DataSource.getRepository
export class IntegracionMovimientoRepository extends Repository<IntegracionMovimientoEntity> {}
