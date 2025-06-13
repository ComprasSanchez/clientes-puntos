import { Cliente } from 'src/context/Cliente/core/Cliente';
import { ClienteRepository } from 'src/context/Cliente/core/Repository/ClienteRepository';

export class ClienteFindAll {
  constructor(private readonly repository: ClienteRepository) {}

  async run(): Promise<Cliente[]> {
    return this.repository.findAll();
  }
}
