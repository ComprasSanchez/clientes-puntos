import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

export class Sucursal {
  private readonly _id: string;
  private _codigo: string;
  private _nombre: string;

  private constructor(id: string, codigo: string, nombre: string) {
    this._id = id;
    this._codigo = codigo;
    this._nombre = nombre;
  }

  /**
   * Fábrica estática para crear sucursales nuevas
   */
  static crear(
    uuidGen: UUIDGenerator,
    codigo: string,
    nombre: string,
  ): Sucursal {
    const id = uuidGen.generate();
    return new Sucursal(id, codigo, nombre);
  }

  /**
   * Fábrica estática para rehidratar sucursales desde persistencia
   */
  static rehidratar(id: string, codigo: string, nombre: string): Sucursal {
    return new Sucursal(id, codigo, nombre);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get codigo(): string {
    return this._codigo;
  }

  get nombre(): string {
    return this._nombre;
  }

  // Setters controlados (si se permite actualizar)
  cambiarCodigo(codigo: string): void {
    this._codigo = codigo;
  }

  cambiarNombre(nombre: string): void {
    this._nombre = nombre;
  }
}
