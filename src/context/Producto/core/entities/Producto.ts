import { Dinero } from '../value-objects/Dinero';
import { NombreProducto } from '../value-objects/NombreProducto';
import { Presentacion } from '../value-objects/Presentacion';
import { ProductoId } from '../value-objects/ProductoId';
import { ClasificadorAsociado } from './ClasificadorAsociado';

export class Producto {
  private _updatedAt: Date;

  private constructor(
    public readonly id: ProductoId,
    public readonly codExt: number,
    public nombre: NombreProducto,
    public presentacion: Presentacion,
    public costo: Dinero,
    public precio: Dinero,
    public clasificadores: ClasificadorAsociado[],
    public readonly createdAt: Date,
  ) {
    this._updatedAt = new Date(createdAt);
  }

  static create(params: {
    id: ProductoId;
    codExt: number;
    nombre: NombreProducto;
    presentacion: Presentacion;
    costo: Dinero;
    precio: Dinero;
    clasificadores: ClasificadorAsociado[];
    createdAt?: Date;
  }): Producto {
    const p = new Producto(
      params.id,
      params.codExt,
      params.nombre,
      params.presentacion,
      params.costo,
      params.precio,
      dedupClasificadores(params.clasificadores),
      params.createdAt ?? new Date(),
    );
    p.assertInvariants();
    return p;
  }

  update(
    data: Partial<{
      nombre: NombreProducto;
      presentacion: Presentacion;
      costo: Dinero;
      precio: Dinero;
      clasificadores: ClasificadorAsociado[];
    }>,
  ) {
    if (data.nombre) this.nombre = data.nombre;
    if (data.presentacion) this.presentacion = data.presentacion;
    if (data.costo) this.costo = data.costo;
    if (data.precio) this.precio = data.precio;
    if (data.clasificadores)
      this.clasificadores = dedupClasificadores(data.clasificadores);
    this._updatedAt = new Date();
    this.assertInvariants();
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  private assertInvariants() {
    if (this.costo.value < 0) throw new Error('Costo no puede ser negativo');
    if (this.precio.value < 0) throw new Error('Precio no puede ser negativo');
  }
}

function dedupClasificadores(
  items: ClasificadorAsociado[],
): ClasificadorAsociado[] {
  const key = (c: ClasificadorAsociado) => `${c.tipo}::${c.idClasificador}`;
  const map = new Map<string, ClasificadorAsociado>();
  for (const c of items) map.set(key(c), c);
  return [...map.values()];
}
