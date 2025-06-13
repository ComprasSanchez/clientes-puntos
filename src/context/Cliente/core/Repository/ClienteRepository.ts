import { Cliente } from '../Cliente';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  findById(id: string): Promise<Cliente | null>;
  findByDni(dni: string): Promise<Cliente | null>;
  findByEmail(email: string): Promise<Cliente | null>;
  create(cliente: Cliente): Promise<Cliente>;
  update(cliente: Cliente): Promise<Cliente>;
  delete(id: string): Promise<void>;
}
