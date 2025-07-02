import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { IPuntosService } from '../../../application/ports/IPuntosService';

export class PuntosServiceInMemory implements IPuntosService {
  constructor(private readonly saldoService: ObtenerSaldo) {}

  async obtenerSaldoActual(clienteId: string): Promise<number> {
    // Llama directamente al dominio de Puntos
    return this.saldoService.run(clienteId);
  }
}
