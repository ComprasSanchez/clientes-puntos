import { Transaccion } from '../../core/entities/Transaccion';
import { TransaccionRepository } from '../../core/repository/TransaccionRepository';
import { TimestampId } from '../../core/value-objects/TimestampId';
import { CreateTransaccionDto } from '../dtos/CreateTransaccionDto';

/**
 * Orquesta la creación y persistencia de una Transaccion.
 * Deja el resto de tu código sin tener que hacer `new Transaccion(...)` cada vez.
 */
export class CreateTransaccionService {
  constructor(private readonly txRepo: TransaccionRepository) {}

  async run(params: CreateTransaccionDto): Promise<TimestampId> {
    // 1️⃣ Déjale al repositorio la generación de ID si usas DB-generated PK
    //    El constructor de Transaccion acepta un ID opcional o null
    const fecha = params.fechaCreacion ?? new Date();
    const timestampId = TimestampId.create();
    const tx = Transaccion.createOrphan({
      publicId: timestampId,
      loteId: params.loteId,
      tipo: params.tipo,
      cantidad: params.cantidad,
      createdAt: fecha,
      referenciaId: params.referenciaId,
    });

    // 2️⃣ Persisto
    await this.txRepo.save(tx);

    return tx.publicId;
  }
}
