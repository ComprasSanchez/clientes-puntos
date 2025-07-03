// src/context/Regla/application/dtos/UpdateReglaDto.ts
import { TipoRegla } from '@regla/core/enums/TipoRegla';

export class UpdateReglaDto {
  nombre?: string;
  tipo?: TipoRegla;
  prioridad?: number;
  activa?: boolean;
  excluyente?: boolean;
  vigenciaInicio?: Date | string; // acepta string (ISO) o Date
  vigenciaFin?: Date | string;
  descripcion?: string;

  // Sólo para reglas con configuración extra (ejemplo: ConversionRule)
  config?: {
    rateAccred?: number;
    rateSpend?: number;
    creditExpiryDays?: number;
  };
}
