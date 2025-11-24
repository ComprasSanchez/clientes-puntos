// puntos/application/saldo/use-cases/GetHistorialSaldoCliente.ts

import { Inject, Injectable } from '@nestjs/common';
import { SALDO_REPO } from '@puntos/core/tokens/tokens';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';
import { HistorialSaldoItemDto } from 'src/context/Metricas/application/clientes/dto/ClienteMetricasDTO';

@Injectable()
export class GetHistorialSaldoCliente {
  constructor(
    @Inject(SALDO_REPO)
    private readonly saldoRepo: SaldoRepository,
  ) {}

  async run(clienteId: string): Promise<HistorialSaldoItemDto[]> {
    const historial: HistorialSaldo[] =
      await this.saldoRepo.findHistorialByClienteId(clienteId);

    return historial.map((h) => ({
      fechaCambio: h.fechaCambio.toISOString(),
      saldoAnterior: h.saldoAnterior.value,
      saldoNuevo: h.saldoNuevo.value,
      motivo: h.motivo, // OpTipo (string/enum)
      referenciaOperacion: h.referenciaOperacion?.value,
    }));
  }
}
