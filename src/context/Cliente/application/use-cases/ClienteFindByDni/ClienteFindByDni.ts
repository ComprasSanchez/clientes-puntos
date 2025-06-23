// src/context/Cliente/application/use-cases/ClienteFindByDni.ts

import { Cliente } from 'src/context/Cliente/core/entities/Cliente';
import { ClienteNotFoundError } from 'src/context/Cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';
import { ClienteDni } from 'src/context/Cliente/core/value-objects/ClienteDni';

export class ClienteFindByDni {
  constructor(private readonly repository: ClienteRepository) {}

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
