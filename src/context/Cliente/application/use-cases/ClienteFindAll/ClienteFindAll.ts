import { Cliente } from 'src/context/Cliente/core/entities/Cliente';
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';

export class ClienteFindAll {
  constructor(private readonly repository: ClienteRepository) {}

  async run(): Promise<Cliente[]> {
    return this.repository.findAll();
  }
}
