// @regla/infra/models/RawRegla.ts
export interface RawRegla {
  id: string;
  nombre: string;
  prioridad: number;
  activa: boolean;
  excluyente: boolean;
  vigenciaInicio: string;
  vigenciaFin?: string;
  descripcion?: string;
  tipo: string;
  condition: any;
  rateAccred?: number;
  rateSpend?: number;
  creditExpiryDays?: number;
  efecto?: string;
}
