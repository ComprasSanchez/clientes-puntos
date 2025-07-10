import { Inject, Injectable } from '@nestjs/common';
import { Saldo } from '../../../core/entities/Saldo';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { SALDO_REPO } from '@puntos/core/tokens/tokens';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';

/**
 * Servicio de dominio para operaciones sobre el agregado Saldo.
 * Orquesta la carga de lotes y transacciones para calcular el saldo.
 */
@Injectable()
export class ObtenerSaldo {
  constructor(
    @Inject(SALDO_REPO) private readonly saldoRepo: SaldoRepository,
  ) {}

  async run(clienteId: string): Promise<number> {
    const saldoActual = await this.saldoRepo.findByClienteId(clienteId);
    const saldo = new Saldo(clienteId, saldoActual ?? new CantidadPuntos(0));
    return saldo.getSaldoActual().value;
  }
}
