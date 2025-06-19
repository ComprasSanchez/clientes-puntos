import { SaldoService } from 'src/context/Puntos/core/services/SaldoService';
import { IPuntosService } from '../../application/ports/IPuntosService';

export class PuntosServiceInMemory implements IPuntosService {
  constructor(private readonly saldoService: SaldoService) {}

  async obtenerSaldoActual(clienteId: string): Promise<number> {
    // Llama directamente al dominio de Puntos
    return this.saldoService.obtenerSaldoActual(clienteId);
  }
}
