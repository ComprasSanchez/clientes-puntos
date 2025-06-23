import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { CreateTransaccionService } from '../../services/CreateTransaccionService';
import { DevolverDto } from '../../dtos/DevolverDto';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { Saldo } from 'src/context/Puntos/core/entities/Saldo';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';

export class DevolverPuntosUseCase {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly createTx: CreateTransaccionService,
  ) {}

  async run(input: DevolverDto): Promise<void> {
    const { clienteId, loteId, puntos, referenciaId } = input;

    // 1️⃣ Cargo lotes y reconstruyo Saldo
    const lotes = await this.loteRepo.findByCliente(clienteId);
    const saldo = new Saldo(clienteId, lotes);

    // 2️⃣ Aplico la reversión pura en dominio
    saldo.revertirPuntos(loteId, new CantidadPuntos(puntos));

    // 3️⃣ Creo la Transacción de devolución
    await this.createTx.run({
      loteId: new LoteId(loteId),
      tipo: TxTipo.DEVOLUCION,
      cantidad: new CantidadPuntos(puntos),
      referenciaId: new ReferenciaMovimiento(referenciaId),
    });

    // 4️⃣ Persistir cambios en el lote afectado
    const lote = lotes.find((l) => l.id.value === loteId)!;
    await this.loteRepo.update(lote);
  }
}
