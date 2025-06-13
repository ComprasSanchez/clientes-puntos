import { ClienteNotFoundError } from '../../core/Exceptions/ClienteNotFoundError';
import { ClienteRepository } from '../../core/Repository/ClienteRepository';
import { ClienteId } from '../../core/ValueObjects/ClienteId';

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
