import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { Inject, Injectable } from '@nestjs/common';
import {
  UpsertClienteFromPlexRequestDto,
  UpsertClienteFromPlexResponseDto,
} from '../dto/clientes-upsert-from-plex.dto';

@Injectable()
export class ClientesUpsertFromPlexService {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly clienteRepo: ClienteRepository,
    private readonly createCliente: ClienteCreate,
    private readonly updateCliente: ClienteUpdate,
  ) {}

  async run(
    dto: UpsertClienteFromPlexRequestDto,
  ): Promise<UpsertClienteFromPlexResponseDto> {
    const dni = dto.dni.trim();
    const tarjetaFidely = dto.tarjetaFidely.trim();

    const existing = await this.clienteRepo.findByDni(new ClienteDni(dni));

    if (!existing) {
      const created = await this.createCliente.run(
        {
          dni,
          idFidely: dto.idFidely,
          tarjetaFidely,
        },
        false,
      );

      if (dto.status && dto.status !== created.status.value) {
        await this.updateCliente.run({
          id: created.id.value,
          status: dto.status,
          idFidely: dto.idFidely,
          tarjetaFidely,
        });
      }

      return {
        clienteId: created.id.value,
        action: 'created',
      };
    }

    await this.updateCliente.run({
      id: existing.id.value,
      status: dto.status,
      idFidely: dto.idFidely,
      tarjetaFidely,
    });

    return {
      clienteId: existing.id.value,
      action: 'updated',
    };
  }
}
