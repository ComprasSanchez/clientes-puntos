import { Cliente } from '../Cliente';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteId } from '../value-objects/ClienteId';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  findById(id: ClienteId): Promise<Cliente | null>;
  findByDni(dni: ClienteDni): Promise<Cliente | null>;
  create(cliente: Cliente): Promise<void>;
  update(cliente: Cliente): Promise<void>;
}
