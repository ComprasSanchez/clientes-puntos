// src/context/Cliente/application/use-cases/ClienteFindByDni.ts

import { Cliente } from 'src/context/Cliente/core/Cliente';
import { ClienteNotFoundError } from 'src/context/Cliente/core/Exceptions/ClienteNotFoundError';
import { ClienteRepository } from 'src/context/Cliente/core/Repository/ClienteRepository';
import { ClienteDni } from 'src/context/Cliente/core/ValueObjects/ClienteDni';

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
      throw new ClienteNotFoundError(`Cliente con DNI "${dni}" no encontrado`);
    }

    return cliente;
  }
}
