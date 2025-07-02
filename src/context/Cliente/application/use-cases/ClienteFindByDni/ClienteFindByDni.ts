/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// @cliente/application/use-cases/ClienteFindByDni.ts

import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindByDni {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  /**
   * Busca un Cliente por su DNI.
   * Lanza ClienteNotFoundError si no existe.
   */
  async run(dni: string): Promise<Cliente> {
    const dniVo = new ClienteDni(dni);
    const cliente = await this.repository.findByDni(dniVo);

    if (!cliente) {
      throw new ClienteNotFoundError(dni);
    }

    return cliente;
  }
}
