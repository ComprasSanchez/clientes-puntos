import { OperacionDto } from './OperacionDto';

export interface AjusteDto extends OperacionDto {
  puntos: number;
  motivo?: string;
}
