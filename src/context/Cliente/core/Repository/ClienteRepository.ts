import { Cliente } from '../Cliente';
import { ClienteDni } from '../ValueObjects/ClienteDni';
import { ClienteEmail } from '../ValueObjects/ClienteEmail';
import { ClienteId } from '../ValueObjects/ClienteId';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  findById(id: ClienteId): Promise<Cliente | null>;
  findByDni(dni: ClienteDni): Promise<Cliente | null>;
  findByEmail(email: ClienteEmail): Promise<Cliente | null>;
  create(cliente: Cliente): Promise<void>;
  update(cliente: Cliente): Promise<void>;
}
