/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClienteFindAll {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  async run(): Promise<Cliente[]> {
    return this.repository.findAll();
  }
}
