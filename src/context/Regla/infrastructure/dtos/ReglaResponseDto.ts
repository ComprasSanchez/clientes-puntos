// src/context/Regla/application/dtos/ReglaResponseDto.ts

import { TipoRegla } from '@regla/core/enums/TipoRegla';

export class ReglaResponseDto {
  id: string;
  nombre: string;
  tipo: TipoRegla | string;
  prioridad: number;
  activa: boolean;
  excluyente: boolean;
  vigenciaInicio: Date | string;
  vigenciaFin?: Date | string;
  descripcion?: string;

  // Opcional, para reglas con configuración específica (ej: CONVERSION)
  config?: {
    rateAccred: number;
    rateSpend: number;
    creditExpiryDays?: number;
  };
}
