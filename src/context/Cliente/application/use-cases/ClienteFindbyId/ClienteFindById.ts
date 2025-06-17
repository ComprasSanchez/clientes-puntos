import { Cliente } from '../../../core/Cliente';
import { ClienteNotFoundError } from '../../../core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '../../../core/repository/ClienteRepository';
import { ClienteId } from '../../../core/value-objects/ClienteId';

export class ClienteFindAll {
  constructor(private readonly repository: ClienteRepository) {}

  async run(id: string): Promise<Cliente> {
    const cliente = await this.repository.findById(new ClienteId(id));

    if (!cliente) {
      throw new ClienteNotFoundError('Cliente no encontrado');
    }

    return cliente;
  }
}
