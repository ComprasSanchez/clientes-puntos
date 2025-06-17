import { ClienteNotFoundError } from '../../../core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '../../../core/repository/ClienteRepository';
import { ClienteId } from '../../../core/value-objects/ClienteId';

export class ClienteDelete {
  constructor(private readonly repo: ClienteRepository) {}

  /**
   * Marca al cliente como inactivo en lugar de borrarlo de la base.
   */
  async run(id: string): Promise<void> {
    const idVo = new ClienteId(id);
    const cliente = await this.repo.findById(idVo);
    if (!cliente) {
      throw new ClienteNotFoundError('Cliente no encontrado');
    }

    cliente.softDelete();
    await this.repo.update(cliente);
  }
}
