import { Injectable } from '@nestjs/common';
import { IntegracionMovimientoEntity } from '../entities/integracion-movimiento.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class IntegracionMovimientoService {
  constructor(
    @InjectRepository(IntegracionMovimientoEntity)
    private readonly repo: Repository<IntegracionMovimientoEntity>,
  ) {}

  async registrarMovimiento(params: {
    tipoIntegracion: string;
    txTipo: string;
    requestPayload: any;
    status: string;
    responsePayload?: any;
    mensajeError?: string;
  }): Promise<IntegracionMovimientoEntity> {
    const mov = this.repo.create({
      ...params,
    });
    return this.repo.save(mov);
  }

  async actualizarMovimiento(
    id: string,
    update: Partial<IntegracionMovimientoEntity>,
  ) {
    await this.repo.update(id, update);
  }
}
