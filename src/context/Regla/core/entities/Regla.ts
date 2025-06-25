import { OpTipo } from 'src/shared/core/enums/OpTipo';

/**
 * Resultado de la ejecución del motor de reglas.
 */
export interface ReglaEngineResult {
  debitos: Array<{ loteId: string; cantidad: number }>;
  credito?: { cantidad: number; expiraEn: Date };
}

/**
 * Contexto que pasa el RuleEngine y las reglas individuales.
 */
export interface ReglaContext {
  clienteId: string;
  tipoOperacion: OpTipo;
  montoMoneda?: number;
  porcentajeOperacion?: number;
  lotes?: Array<{ id: string; cantidadDisponible: number }>;
  fechaOperacion?: Date;
}

export abstract class Regla {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly prioridad: number,
    public readonly activa: boolean,
    public readonly excluyente: boolean,
    public readonly vigenciaInicio: Date,
    public readonly vigenciaFin?: Date,
    public readonly descripcion?: string,
  ) {}

  /**
   * Verifica si la regla está activa y dentro de su vigencia.
   */
  public isApplicable(fecha: Date = new Date()): boolean {
    if (!this.activa) {
      return false;
    }
    if (fecha < this.vigenciaInicio) {
      return false;
    }
    if (this.vigenciaFin && fecha > this.vigenciaFin) {
      return false;
    }
    return true;
  }

  /**
   * Ejecuta la lógica de la regla y devuelve un resultado parcial.
   */
  public abstract apply(context: ReglaContext): Promise<ReglaEngineResult>;
}
