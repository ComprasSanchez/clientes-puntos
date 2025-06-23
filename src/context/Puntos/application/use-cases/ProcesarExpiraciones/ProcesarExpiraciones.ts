import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { CreateTransaccionService } from '../../services/CreateTransaccionService';
import { Saldo } from 'src/context/Puntos/core/entities/Saldo';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';

export class ProcesarExpiracionesUseCase {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly createTx: CreateTransaccionService,
  ) {}

  async run(): Promise<void> {
    // 1️⃣ Obtengo todos los lotes
    const allLotes = await this.loteRepo.findAll();

    // 2️⃣ Agrupo por cliente
    const lotesPorCliente = new Map<string, Lote[]>();
    for (const lote of allLotes) {
      const id = lote.clienteId.value;
      const arr = lotesPorCliente.get(id) || [];
      arr.push(lote);
      lotesPorCliente.set(id, arr);
    }

    // 3️⃣ Para cada cliente, proceso expiraciones
    for (const [clienteId, lotes] of lotesPorCliente) {
      const saldo = new Saldo(clienteId, lotes);
      const expirados = saldo.procesarExpiraciones();

      // 4️⃣ Creo transacción de expiración y actualizo cada lote
      for (const lote of expirados) {
        await this.createTx.run({
          loteId: lote.id,
          tipo: TxTipo.EXPIRACION,
          cantidad: lote.remaining,
        });
        await this.loteRepo.update(lote);
      }
    }
  }
}
