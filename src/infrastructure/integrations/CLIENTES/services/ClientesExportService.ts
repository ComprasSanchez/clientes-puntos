// points/src/application/clientes/ClientesExportService.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import {
  PuntosClienteBatch,
  PuntosClienteRawDto,
} from '../dto/clientes-export.dto';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';

type CursorPayload = { lastId: string | null };

function encodeCursor(p: CursorPayload): string {
  return Buffer.from(JSON.stringify(p), 'utf8').toString('base64');
}
function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor) return null;
  try {
    return JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf8'),
    ) as CursorPayload;
  } catch {
    return null;
  }
}

@Injectable()
export class ClientesExportService {
  constructor(@Inject(CLIENTE_REPO) private readonly repo: ClienteRepository) {}

  async fetchAllPaged(input: {
    batchSize?: number;
    cursor?: string | null;
  }): Promise<PuntosClienteBatch> {
    const batchSize = Math.max(1, Math.min(10_000, input.batchSize ?? 2000));
    const c = decodeCursor(input.cursor);

    const lastId =
      c?.lastId && c.lastId.trim().length > 0 ? new ClienteId(c.lastId) : null;

    // 🔹 ahora usamos el método de dominio, no createQueryBuilder
    const list = await this.repo.findPagedByIdAsc({
      lastId,
      limit: batchSize,
    });

    const rows: PuntosClienteRawDto[] = list.map((c) => ({
      id: c.id.value,
      dni: c.dni.value,
      nombre: c.nombre.value,
      apellido: c.apellido.value,
      fidelyId: c.fidelyStatus.idFidely.value!.toString(),
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      updatedAt: c.timestamp.updatedAt.toString(),
    }));

    const last = list.at(-1);
    const cursor = last ? encodeCursor({ lastId: last.id.value }) : null;

    return { rows, cursor };
  }
}
