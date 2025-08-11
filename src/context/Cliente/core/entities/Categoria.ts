import { CategoriaDescripcion } from '../value-objects/CategoriaDescripcion';
import { CategoriaId } from '../value-objects/CategoriaId';
import { CategoriaNombre } from '../value-objects/CategoriaNombre';

export class Categoria {
  private readonly _id: CategoriaId;
  private _nombre: CategoriaNombre;
  private _descripcion: CategoriaDescripcion;
  private _default: boolean;
  private _codExt: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: CategoriaId,
    nombre: CategoriaNombre,
    codExt: number,
    descripcion?: CategoriaDescripcion,
    isDefault?: boolean,
  ) {
    this._id = id;
    this._nombre = nombre;
    this._descripcion = descripcion ?? new CategoriaDescripcion(null);
    this._default = isDefault ?? false; // Default to false unless specified otherwise
    this._codExt = codExt;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): CategoriaId {
    return this._id;
  }

  get nombre(): CategoriaNombre {
    return this._nombre;
  }

  get descripcion(): CategoriaDescripcion {
    return this._descripcion;
  }

  get isDefault(): boolean {
    return this._default;
  }

  get timestamp(): { createdAt: Date; updatedAt: Date } {
    return {
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  cambiarNombre(nuevoNombre: CategoriaNombre): void {
    this._nombre = nuevoNombre;
    this.touch();
  }

  cambiarDescripcion(nuevaDescripcion: CategoriaDescripcion): void {
    this._descripcion = nuevaDescripcion;
    this.touch();
  }

  cambiarDefault(isDefault: boolean): void {
    this._default = isDefault;
    this.touch();
  }

  touch(): void {
    this._updatedAt = new Date();
  }
}
