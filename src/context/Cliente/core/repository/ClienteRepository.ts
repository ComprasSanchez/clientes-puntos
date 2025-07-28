import { Cliente } from '../entities/Cliente';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  findById(id: ClienteId): Promise<Cliente | null>;
  findByDni(dni: ClienteDni): Promise<Cliente | null>;
  findByNroTarjeta(nroTarjeta: ClienteTarjetaFidely): Promise<Cliente | null>;
  existsByTarjetaFidely(numero: string): Promise<boolean>;
  create(cliente: Cliente): Promise<void>;
  update(cliente: Cliente): Promise<void>;
}
