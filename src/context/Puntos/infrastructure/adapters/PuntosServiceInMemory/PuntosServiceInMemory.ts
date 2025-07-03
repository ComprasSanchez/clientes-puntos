import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { IPuntosService } from '../../../../Cliente/application/ports/IPuntosService';
import { Inject, Injectable } from '@nestjs/common';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';

@Injectable()
export class PuntosServiceInMemory implements IPuntosService {
  constructor(
    @Inject(OBTENER_SALDO_SERVICE) private readonly saldoService: ObtenerSaldo,
  ) {}

  async obtenerSaldoActual(clienteId: string): Promise<number> {
    // Llama directamente al dominio de Puntos
    return this.saldoService.run(clienteId);
  }
}
