/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteDelete {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repo: ClienteRepository,
  ) {}

  /**
   * Marca al cliente como inactivo en lugar de borrarlo de la base.
   */
  async run(id: string): Promise<void> {
    const idVo = new ClienteId(id);
    const cliente = await this.repo.findById(idVo);
    if (!cliente) {
      throw new ClienteNotFoundError(id);
    }

    cliente.softDelete();
    await this.repo.update(cliente);
  }
}
