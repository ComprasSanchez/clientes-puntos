import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';

export interface SaldoClienteDto {
  clienteId: string;
  puntos: CantidadPuntos;
}
