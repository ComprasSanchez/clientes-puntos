// src/context/Regla/application/dtos/CreateReglaDto.ts
import { TipoRegla } from '@regla/core/enums/TipoRegla';

export class CreateReglaDto {
  nombre: string;
  tipo: TipoRegla;
  prioridad: number;
  activa: boolean;
  excluyente: boolean;
  vigenciaInicio: Date;
  vigenciaFin?: Date;
  descripcion?: string;

  // Si tipo === CONVERSION, mandás config como ConversionConfigDto
  config?: {
    rateAccred: number; // ejemplo
    rateSpend: number;
    creditExpiryDays?: number;
  };
}
