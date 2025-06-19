import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { Saldo } from '../entities/Saldo';
import { LoteRepository } from '../repository/LoteRepository';
import { TransaccionRepository } from '../repository/TransaccionRepository';

/**
 * Servicio de dominio para operaciones sobre el agregado Saldo.
 * Orquesta la carga de lotes y transacciones para calcular el saldo.
 */
export class SaldoService {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly transRepo: TransaccionRepository,
  ) {}

  /**
   * Obtiene el saldo actual de puntos de un cliente.
   * @param clienteId  ID del cliente (string)
   * @returns número de puntos disponibles
   */
  async obtenerSaldoActual(clienteId: string): Promise<number> {
    const cliId = new ClienteId(clienteId);
    // Cargar todos los lotes (DISPONIBLES por defecto)
    const lotes = await this.loteRepo.findByCliente(cliId);
    // Cargar todas las transacciones (si necesitas para lógica adicional)
    const transacciones = await this.transRepo.findByCliente(cliId);

    // Reconstituir el agregado Saldo
    const saldoAgregado = new Saldo(cliId, lotes, transacciones);
    const saldoVo = saldoAgregado.saldoActual;
    return saldoVo.value;
  }

  // Métodos adicionales (acreditar, gastar, devolver) pueden implementarse aquí:
  // async acreditar(...): Promise<void> { ... }
  // async gastar(...): Promise<void> { ... }
  // async devolver(...): Promise<void> { ... }
}
