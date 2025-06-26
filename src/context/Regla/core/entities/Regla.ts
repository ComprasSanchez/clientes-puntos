import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/ReglaEngine';
import { ReglaDescripcion } from '../value-objects/ReglaDescripcion';
import { ReglaFlag } from '../value-objects/ReglaFlag';
import { ReglaId } from '../value-objects/ReglaId';
import { ReglaNombre } from '../value-objects/ReglaNombre';
import { ReglaPrioridad } from '../value-objects/ReglaPrioridad';
import { ReglaVigenciaFin } from '../value-objects/ReglaVigenciaFin';
import { ReglaVigenciaInicio } from '../value-objects/ReglaVigenciaInicio';

export abstract class Regla {
  constructor(
    public readonly id: ReglaId,
    public readonly nombre: ReglaNombre,
    public readonly prioridad: ReglaPrioridad,
    public readonly activa: ReglaFlag,
    public readonly excluyente: ReglaFlag,
    public readonly vigenciaInicio: ReglaVigenciaInicio,
    public readonly vigenciaFin?: ReglaVigenciaFin,
    public readonly descripcion?: ReglaDescripcion,
  ) {}

  /**
   * Verifica si la regla está activa y dentro de su vigencia.
   */
  public isApplicable(fecha: Date = new Date()): boolean {
    if (!this.activa) {
      return false;
    }
    if (fecha < this.vigenciaInicio.value) {
      return false;
    }
    if (this.vigenciaFin && fecha > this.vigenciaFin.value) {
      return false;
    }
    return true;
  }

  /**
   * Ejecuta la lógica de la regla y devuelve un resultado parcial.
   */
  public abstract apply(context: ReglaEngineRequest): ReglaEngineResult;
}
