/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';

export class ClienteFindAll {
  constructor(private readonly repository: ClienteRepository) {}

  async run(): Promise<Cliente[]> {
    return this.repository.findAll();
  }
}
