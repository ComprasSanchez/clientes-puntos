import { IPuntosService } from '../../application/ports/IPuntosService';

export class PuntosServiceInMemory implements IPuntosService {
  constructor(private readonly saldoService: SaldoService) {}

  async obtenerSaldoActual(clienteId: string): Promise<number> {
    // Llama directamente al dominio de Puntos
    return this.saldoService.obtenerSaldo(clienteId);
  }
}
