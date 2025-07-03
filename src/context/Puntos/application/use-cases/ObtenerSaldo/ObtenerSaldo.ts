import { Inject, Injectable } from '@nestjs/common';
import { Saldo } from '../../../core/entities/Saldo';
import { LoteRepository } from '../../../core/repository/LoteRepository';
import { LOTE_REPO } from '@puntos/core/tokens/tokens';

/**
 * Servicio de dominio para operaciones sobre el agregado Saldo.
 * Orquesta la carga de lotes y transacciones para calcular el saldo.
 */
@Injectable()
export class ObtenerSaldo {
  constructor(@Inject(LOTE_REPO) private readonly loteRepo: LoteRepository) {}

  async run(clienteId: string): Promise<number> {
    const lotes = await this.loteRepo.findByCliente(clienteId);
    const saldo = new Saldo(clienteId, lotes);
    return saldo.getSaldoActual().value;
  }
}
