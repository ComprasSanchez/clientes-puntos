import { TipoRegla } from '../enums/TipoRegla';
import { ConversionRuleDTO } from './ConversionRuleDTO';

export type ReglaDTO = ConversionRuleDTO;

export interface BaseReglaDTO {
  tipo: { value: TipoRegla };
  id: { value: string };
  _nombre: { value: string };
  _prioridad: { value: number };
  _activa: { value: boolean };
  _excluyente: { value: boolean };
  _vigenciaInicio: { value: string }; // ISO
  _vigenciaFin?: { value: string };
  _descripcion?: { value: string };
}
