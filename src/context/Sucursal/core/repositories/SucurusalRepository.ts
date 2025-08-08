import { Sucursal } from '../entities/Sucursal';

export interface SucursalRepository {
  save(sucursal: Sucursal): Promise<void>;
  findById(id: string): Promise<Sucursal | null>;
  findByCodigo(codigo: string): Promise<Sucursal | null>;
  existsCodigo(codigo: string): Promise<boolean>;
  deleteById(id: string): Promise<void>;
}
