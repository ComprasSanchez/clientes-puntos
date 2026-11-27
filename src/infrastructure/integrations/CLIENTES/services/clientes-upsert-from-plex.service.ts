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
import { FidelizarClienteResponseDto } from '../dto/clientes-fidelizar.dto';

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

  /**
   * Alta desde el portal/app: fideliza con tarjeta virtual (tarjeta = DNI),
   * igual que la caja. Si ya existe no toca nada (no pisa la tarjeta de Plex).
   * El alta queda pendiente para novedades, así Plex se entera.
   */
  async fidelizar(dniRaw: string): Promise<FidelizarClienteResponseDto> {
    const dni = dniRaw.trim();
    const existing = await this.clienteRepo.findByDni(new ClienteDni(dni));
    if (existing) {
      return {
        clienteId: existing.id.value,
        tarjetaFidely: String(existing.fidelyStatus.tarjetaFidely.value ?? ''),
        created: false,
      };
    }

    const created = await this.createCliente.run({ dni }, true);
    return {
      clienteId: created.id.value,
      tarjetaFidely: String(created.fidelyStatus.tarjetaFidely.value ?? ''),
      created: true,
    };
  }

  async touch(dni: string): Promise<void> {
    await this.clienteRepo.touchByDni(dni);
  }
}
