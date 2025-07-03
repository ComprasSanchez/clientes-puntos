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
  protected _updatedAt: Date = new Date();

  constructor(
    public readonly id: ReglaId,
    protected _nombre: ReglaNombre,
    public readonly tipo: ReglaTipo,
    protected _prioridad: ReglaPrioridad,
    protected _activa: ReglaFlag,
    protected _excluyente: ReglaFlag,
    protected _vigenciaInicio: ReglaVigenciaInicio,
    protected _vigenciaFin?: ReglaVigenciaFin,
    protected _descripcion?: ReglaDescripcion,
    protected readonly condition?: Condition<ReglaEngineRequest>,
  ) {}

  // --- Getters (recomendado en DDD) ---
  get nombre(): ReglaNombre {
    return this._nombre;
  }
  get prioridad(): ReglaPrioridad {
    return this._prioridad;
  }
  get activa(): ReglaFlag {
    return this._activa;
  }
  get excluyente(): ReglaFlag {
    return this._excluyente;
  }
  get vigenciaInicio(): ReglaVigenciaInicio {
    return this._vigenciaInicio;
  }
  get vigenciaFin(): ReglaVigenciaFin | undefined {
    return this._vigenciaFin;
  }
  get descripcion(): ReglaDescripcion | undefined {
    return this._descripcion;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Setters estilo DDD ---
  cambiarNombre(nuevoNombre: ReglaNombre): void {
    this._nombre = nuevoNombre;
    this.touch();
  }

  cambiarDescripcion(nuevaDescripcion: ReglaDescripcion): void {
    this._descripcion = nuevaDescripcion;
    this.touch();
  }

  cambiarPrioridad(nuevaPrioridad: ReglaPrioridad): void {
    this._prioridad = nuevaPrioridad;
    this.touch();
  }

  cambiarActiva(activa: ReglaFlag): void {
    this._activa = activa;
    this.touch();
  }

  cambiarExcluyente(excluyente: ReglaFlag): void {
    this._excluyente = excluyente;
    this.touch();
  }

  cambiarVigenciaInicio(vigenciaInicio: ReglaVigenciaInicio): void {
    this._vigenciaInicio = vigenciaInicio;
    this.touch();
  }

  cambiarVigenciaFin(vigenciaFin?: ReglaVigenciaFin): void {
    this._vigenciaFin = vigenciaFin;
    this.touch();
  }

  // --- touch ---
  protected touch(): void {
    this._updatedAt = new Date();
  }

  // --- Lógica de dominio original ---
  public isApplicable(fecha: Date = new Date()): boolean {
    if (!this._activa.value) return false;
    if (fecha < this._vigenciaInicio.value) return false;
    if (this._vigenciaFin && fecha > this._vigenciaFin.value) return false;
    return true;
  }

  public apply(context: ReglaEngineRequest): ReglaEngineResult {
    if (!this.isApplicable(context.fecha.value)) {
      return { debitAmount: 0 };
    }
    if (this.condition && !this.condition.evaluate(context)) {
      return { debitAmount: 0 };
    }
    return this.applyIfTrue(context);
  }

  protected abstract applyIfTrue(
    context: ReglaEngineRequest,
  ): ReglaEngineResult;
}
