import { MetricasOperacion } from '../entities/MetricasOperacion';

// core/repository/MetricaGlobalDiariaRepository.ts
export interface MetricasOperacionRepository {
  save(metrica: MetricasOperacion): Promise<void>;
  findByFecha(fecha: Date): Promise<MetricasOperacion | null>;
  findBetweenFechas(desde: Date, hasta: Date): Promise<MetricasOperacion[]>;
}
