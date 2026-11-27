import { OperacionDto } from './OperacionDto';

export interface AjusteDto extends OperacionDto {
  puntos: number;
  motivo?: string;
  /** Clave del sistema externo que lo pide (evita acreditar dos veces). */
  claveExterna?: string;
}
