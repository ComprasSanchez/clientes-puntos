// @cliente/infrastructure/adapters/ClienteQueryAdapter.ts
import { Injectable } from '@nestjs/common';
import {
  ClienteBasicData,
  ClienteQueryPort,
} from '@cliente/core/interfaces/ClienteQuery';
import { ClienteFindById } from '@cliente/application/use-cases/ClienteFindbyId/ClienteFindById';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';

@Injectable()
export class ClienteQueryAdapter implements ClienteQueryPort {
  constructor(private readonly uc: ClienteFindById) {}

  async findById(id: string): Promise<ClienteBasicData | null> {
    const clienteId = new ClienteId(id);
    const cliente: ClienteResponseDto | null = await this.uc.run(
      clienteId.value,
    );
    if (!cliente) return null;

    const result: ClienteBasicData = {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      documento: cliente.dni,
    };

    return result;
  }
}
