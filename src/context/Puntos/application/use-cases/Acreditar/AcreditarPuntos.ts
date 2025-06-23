import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { CreateTransaccionService } from '../../services/CreateTransaccionService';
import { AcreditarDto } from '../../dtos/AcreditarDto';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';
import { FechaExpiracion } from 'src/context/Puntos/core/value-objects/FechaExpiracion';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { UUIDGenerator } from 'src/shared/core/uuid/UuidGenerator';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';

export class AcreditarPuntosUseCase {
  constructor(
    private readonly idGen: UUIDGenerator,
    private readonly loteRepo: LoteRepository,
    private readonly createTx: CreateTransaccionService,
  ) {}

  async run(input: AcreditarDto): Promise<void> {
    const { clienteId, cantidadOriginal, expiraEn, origenTipo, referenciaId } =
      input;

    // 1️⃣ Generar el ID del lote (usando un VO con fábrica UUID interna)
    const loteId = new LoteId(this.idGen.generate());

    // 2️⃣ Convertir a Value Objects
    const clienteVO = new ClienteId(clienteId);
    const cantidadVO = new CantidadPuntos(cantidadOriginal);
    const expiraVO = expiraEn ? new FechaExpiracion(new Date(expiraEn)) : null;
    const origen = new OrigenOperacion(origenTipo);
    const referenciaVO = referenciaId
      ? new ReferenciaMovimiento(referenciaId)
      : undefined;

    // 3️⃣ Construir el nuevo lote
    const nuevoLote = new Lote(
      loteId,
      clienteVO,
      cantidadVO, // cantidadOriginal
      cantidadVO, // remaining arranca igual a cantidadOriginal
      BatchEstado.DISPONIBLE,
      new Date(), // createdAt = ahora
      expiraVO, // puede ser null
      origen,
      referenciaVO,
    );

    // 4️⃣ Persistir el lote
    await this.loteRepo.save(nuevoLote);

    // 5️⃣ Crear y persistir la transacción de acreditación
    await this.createTx.run({
      loteId: nuevoLote.id,
      tipo: TxTipo.ACREDITACION,
      cantidad: nuevoLote.remaining,
      referenciaId: referenciaVO,
    });
  }
}
