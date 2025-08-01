import { Injectable, Inject } from '@nestjs/common';
import { Saldo } from '@puntos/core/entities/Saldo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import {
  CreateOperacionResponse,
  CreateOperacionTransaccionDto,
} from '../dtos/CreateOperacionResponse';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { RefundError } from '../../core/exceptions/Operacion/RefundError';
// Inyecta aquí tus handlers
import { CompraHandler } from '../handlers/CompraHandler';
import { AjusteHandler } from '../handlers/AjusteHandler';
import { DevolucionHandler } from '../handlers/DevolucionHandler';
import { AnulacionHandler } from '../handlers/AnulacionHandler';
import {
  AJUSTE_HANDLER,
  ANULACION_HANDLER,
  COMPRA_HANDLER,
  DEVOLUCION_HANDLER,
  LOTE_REPO,
  OPERACION_REPO,
  SALDO_REPO,
  TX_REPO,
} from '@puntos/core/tokens/tokens';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { HandlerResult } from '../dtos/HandlerResult';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { Lote } from '@puntos/core/entities/Lote';

@Injectable()
export class CreateOperacionService {
  constructor(
    @Inject(LOTE_REPO) private readonly loteRepo: LoteRepository,
    @Inject(SALDO_REPO) private readonly saldoRepo: SaldoRepository,
    @Inject(TX_REPO)
    private readonly txRepo: TransaccionRepository,
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
    // Handlers:
    @Inject(COMPRA_HANDLER) private readonly compraHandler: CompraHandler,
    @Inject(AJUSTE_HANDLER) private readonly ajusteHandler: AjusteHandler,
    @Inject(DEVOLUCION_HANDLER)
    private readonly devolucionHandler: DevolucionHandler,
    @Inject(ANULACION_HANDLER)
    private readonly anulacionHandler: AnulacionHandler,
  ) {}

  async execute(
    req: CreateOperacionRequest,
    ctx?: TransactionContext,
    tipoAjuste?: TxTipo,
  ): Promise<CreateOperacionResponse> {
    // 1️⃣ Cargar saldo y lotes del cliente
    const saldoActual =
      (await this.saldoRepo.findByClienteId(req.clienteId)) ??
      new CantidadPuntos(0);
    const lotes = await this.loteRepo.findByCliente(req.clienteId);
    const saldo = new Saldo(req.clienteId, saldoActual, lotes);

    let handlerResult: HandlerResult;
    let txsOriginal: Transaccion[] = [];

    // 2️⃣ Seleccionar handler según tipo de operación
    switch (req.tipo) {
      case OpTipo.COMPRA:
        handlerResult = await this.compraHandler.handle(req, saldo, ctx);
        break;

      case OpTipo.AJUSTE:
        if (!tipoAjuste) throw new Error('Falta tipo de ajuste');
        handlerResult = await this.ajusteHandler.handle(
          req,
          saldo,
          tipoAjuste,
          ctx,
        );
        break;

      case OpTipo.DEVOLUCION:
        // Buscar transacciones originales (puede quedar vacío)
        if (req.operacionId) {
          txsOriginal = await this.txRepo.findByOperationId(
            req.operacionId.value,
          );
        } else if (req.referencia) {
          txsOriginal = await this.txRepo.findByReferencia(
            req.referencia.value!,
          );
          req.operacionId = txsOriginal[0]?.operationId; // Para consistencia
        }
        handlerResult = await this.devolucionHandler.handle(
          req,
          saldo,
          txsOriginal,
          ctx,
        );
        break;

      case OpTipo.ANULACION:
        // Buscar transacciones originales (NO puede quedar vacío)
        if (req.operacionId) {
          txsOriginal = await this.txRepo.findByOperationId(
            req.operacionId.value,
          );
        } else if (req.referencia) {
          txsOriginal = await this.txRepo.findByReferencia(
            req.referencia.value!,
          );
          req.operacionId = txsOriginal[0]?.operationId;
        }
        if (!txsOriginal || txsOriginal.length === 0) {
          throw new RefundError(); // O el error que uses para ausencia de movimientos a anular
        }
        handlerResult = await this.anulacionHandler.handle(
          req,
          saldo,
          txsOriginal,
          ctx,
        );
        break;

      default:
        throw new Error(`Tipo de operación no soportado`);
    }

    // 3️⃣ Persistir cambios: lotes, nuevo lote, transacciones, operación
    // Guardar lotes actualizados
    for (const lote of handlerResult.lotesActualizados) {
      await this.loteRepo.update(lote, ctx);
    }
    // Guardar nuevo lote (si hay)
    if (handlerResult.nuevoLote) {
      await this.loteRepo.save(handlerResult.nuevoLote, ctx);
    }
    // Guardar transacciones
    for (const tx of handlerResult.transacciones) {
      await this.txRepo.save(tx, ctx);
    }
    // Guardar operación
    await this.operacionRepo.save(handlerResult.operacion, ctx);

    // 4️⃣ Armar y devolver la respuesta estándar
    const puntosDebito = handlerResult.transacciones
      .filter((t: Transaccion) => t.tipo !== TxTipo.ACREDITACION)
      .reduce((acc, t) => acc + t.cantidad.value, 0);

    const puntosCredito = handlerResult.transacciones
      .filter((t: Transaccion) => t.tipo === TxTipo.ACREDITACION)
      .reduce((acc, t) => acc + t.cantidad.value, 0);

    const lotesAfectados: LoteId[] = [
      ...handlerResult.lotesActualizados.map((lote: Lote) => lote.id),
      ...(handlerResult.nuevoLote ? [handlerResult.nuevoLote.id] : []),
    ];

    const transacciones: CreateOperacionTransaccionDto[] =
      handlerResult.transacciones.map((t: Transaccion) => ({
        id: t.id.value,
        operacionId: t.operationId.value,
        loteId: t.loteId.value,
        tipo: t.tipo,
        cantidad: t.cantidad.value,
        createdAt: t.createdAt,
      }));

    const response: CreateOperacionResponse = {
      operacionId: handlerResult.operacion.id.value,
      puntosDebito,
      puntosCredito,
      lotesAfectados,
      transacciones,
    };

    return response;
  }
}
