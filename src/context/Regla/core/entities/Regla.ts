import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';
import { Condition } from '../interfaces/Condition';
import { ReglaDescripcion } from '../value-objects/ReglaDescripcion';
import { ReglaFlag } from '../value-objects/ReglaFlag';
import { ReglaId } from '../value-objects/ReglaId';
import { ReglaNombre } from '../value-objects/ReglaNombre';
import { ReglaPrioridad } from '../value-objects/ReglaPrioridad';
import { ReglaTipo } from '../value-objects/ReglaTipo';
import { ReglaVigenciaFin } from '../value-objects/ReglaVigenciaFin';
import { ReglaVigenciaInicio } from '../value-objects/ReglaVigenciaInicio';

export abstract class Regla {
  constructor(
    public readonly id: ReglaId,
    public readonly nombre: ReglaNombre,
    public readonly tipo: ReglaTipo,
    public readonly prioridad: ReglaPrioridad,
    public readonly activa: ReglaFlag,
    public readonly excluyente: ReglaFlag,
    public readonly vigenciaInicio: ReglaVigenciaInicio,
    public readonly vigenciaFin?: ReglaVigenciaFin,
    public readonly descripcion?: ReglaDescripcion,
    protected readonly condition?: Condition<ReglaEngineRequest>,
  ) {}

  /**
   * Verifica si la regla está activa y dentro de su vigencia.
   */
  public isApplicable(fecha: Date = new Date()): boolean {
    if (!this.activa.value) return false;
    if (fecha < this.vigenciaInicio.value) return false;
    if (this.vigenciaFin && fecha > this.vigenciaFin.value) return false;
    return true;
  }

  /**
   * Ejecuta la regla: primero vigencia, luego condición (si existe),
   * y finalmente la lógica concreta.
   */
  public apply(context: ReglaEngineRequest): ReglaEngineResult {
    // 1. Vigencia / activa
    if (!this.isApplicable(context.fecha.value)) {
      return { debitAmount: 0 };
    }

    // 2. Condición de aplicación
    if (this.condition && !this.condition.evaluate(context)) {
      return { debitAmount: 0 };
    }

    // 3. Lógica propia de la subclase
    return this.applyIfTrue(context);
  }

  /**
   * Cada subclase implementa aquí su lógica sabiendo que
   * ya pasó vigencia y condición.
   */
  protected abstract applyIfTrue(
    context: ReglaEngineRequest,
  ): ReglaEngineResult;
}
