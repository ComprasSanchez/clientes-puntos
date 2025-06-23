import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { GastarDto } from '../../dtos/GastarDto';
import { CreateTransaccionService } from '../../services/CreateTransaccionService';
import { Saldo } from 'src/context/Puntos/core/entities/Saldo';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';

export class GastarPuntosUseCase {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly createTx: CreateTransaccionService,
  ) {}

  async run(input: GastarDto): Promise<void> {
    const { clienteId, puntos, referenciaId } = input;

    // 1️⃣ Cargo los lotes y reconstruyo Saldo
    const lotes = await this.loteRepo.findByCliente(clienteId);
    const saldo = new Saldo(clienteId, lotes);

    // 2️⃣ Aplico el consumo puro en dominio
    saldo.consumirPuntos(new CantidadPuntos(puntos));

    // 3️⃣ Por cada detalle de consumo, creo la Transacción y actualizo el lote
    for (const { loteId, cantidad } of saldo.getDetalleConsumo()) {
      await this.createTx.run({
        loteId: new LoteId(loteId),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(cantidad),
        referenciaId: new ReferenciaMovimiento(referenciaId),
      });
      // Persistir cambios en el lote
      const lote = lotes.find((l) => l.id.value === loteId)!;
      await this.loteRepo.update(lote);
    }
  }
}
