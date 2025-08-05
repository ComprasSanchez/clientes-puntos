// /metricas/application/clientes/ports/ClienteMetricaRepository.ts

import { ClienteMetrica } from '../entities/ClienteMetrica';

export interface ClienteMetricaRepository {
  save(metrica: ClienteMetrica): Promise<void>;

  findByClienteIdAndDateRange(
    clienteId: string,
    desde: Date,
    hasta: Date,
  ): Promise<ClienteMetrica[]>;

  findByDniAndDateRange(
    dni: string,
    desde: Date,
    hasta: Date,
  ): Promise<ClienteMetrica[]>;
}
