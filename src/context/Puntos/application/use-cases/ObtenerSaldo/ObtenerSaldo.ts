import { Saldo } from '../../../core/entities/Saldo';
import { LoteRepository } from '../../../core/repository/LoteRepository';

/**
 * Servicio de dominio para operaciones sobre el agregado Saldo.
 * Orquesta la carga de lotes y transacciones para calcular el saldo.
 */

export class ObtenerSaldo {
  constructor(private readonly loteRepo: LoteRepository) {}

  async run(clienteId: string): Promise<number> {
    const lotes = await this.loteRepo.findByCliente(clienteId);
    const saldo = new Saldo(clienteId, lotes);
    return saldo.getSaldoActual().value;
  }
}
