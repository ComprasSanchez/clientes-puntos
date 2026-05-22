// puntos/application/saldo/use-cases/GetHistorialSaldoCliente.ts

import { Inject, Injectable } from '@nestjs/common';
import { SALDO_REPO } from '@puntos/core/tokens/tokens';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';
import { HistorialSaldoItemDto } from 'src/context/Metricas/application/clientes/dto/ClienteMetricasDTO';
import { PaginationParams } from '@shared/core/contracts/pagination';

export interface HistorialSaldoPageResponse {
  items: HistorialSaldoItemDto[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class GetHistorialSaldoCliente {
  constructor(
    @Inject(SALDO_REPO)
    private readonly saldoRepo: SaldoRepository,
  ) {}

  async run(clienteId: string): Promise<HistorialSaldoItemDto[]> {
    const historial: HistorialSaldo[] =
      await this.saldoRepo.findHistorialByClienteId(clienteId);

    return historial.map((h) => this.toDto(h));
  }

  async runPaginated(
    clienteId: string,
    params: PaginationParams,
  ): Promise<HistorialSaldoPageResponse> {
    const { items, total } =
      await this.saldoRepo.findHistorialByClienteIdPaginated(clienteId, params);

    return {
      items: items.map((h) => this.toDto(h)),
      total,
      page: params.page,
      limit: params.limit,
      hasNext: params.page < Math.ceil(total / params.limit),
    };
  }

  private toDto(h: HistorialSaldo): HistorialSaldoItemDto {
    return {
      fechaCambio: h.fechaCambio.toISOString(),
      saldoAnterior: h.saldoAnterior.value,
      saldoNuevo: h.saldoNuevo.value,
      motivo: h.motivo,
      referenciaOperacion: h.referenciaOperacion?.value,
    };
  }
}
