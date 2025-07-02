/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindById {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  async run(id: string): Promise<Cliente> {
    const cliente = await this.repository.findById(new ClienteId(id));

    if (!cliente) {
      throw new ClienteNotFoundError(id);
    }

    return cliente;
  }
}
