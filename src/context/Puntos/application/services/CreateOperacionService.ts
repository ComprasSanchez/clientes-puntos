// src/application/services/CreateOperacionService.ts
import { Saldo } from '@puntos/core/entities/Saldo';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { MontoMoneda } from '@puntos/core/value-objects/MontoMoneda';
import { Moneda } from '@puntos/core/value-objects/Moneda';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../dtos/CreateOperacionResponse';
import { TransaccionFactory } from '@puntos/core/factories/TransaccionFactory';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { IReglaEngine } from '@puntos/core/interfaces/IReglaEngine';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { LoteId } from '../../core/value-objects/LoteId';
import { Transaccion } from '../../core/entities/Transaccion';
import { SaldoHandler } from './SaldoHandler';
import { RefundError } from '../../core/exceptions/Operacion/RefundError';
import { Inject, Injectable } from '@nestjs/common';
import {
  LOTE_REPO,
  OPERACION_REPO,
  SALDO_HANDLER,
  SALDO_REPO,
  TX_FACTORY,
  TX_REPO,
} from '@puntos/core/tokens/tokens';
import { REGLA_ENGINE_ADAPTER } from '@regla/core/tokens/tokens';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';

@Injectable()
export class CreateOperacionService {
  constructor(
    @Inject(LOTE_REPO)
    private readonly loteRepo: LoteRepository,
    @Inject(SALDO_REPO)
    private readonly saldoRepo: SaldoRepository,
    @Inject(TX_REPO)
    private readonly txRepo: TransaccionRepository,
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
    @Inject(REGLA_ENGINE_ADAPTER)
    private readonly reglaEngine: IReglaEngine,
    @Inject(TX_FACTORY)
    private readonly txFactory: TransaccionFactory,
    @Inject(SALDO_HANDLER)
    private readonly saldoHandler: SaldoHandler,
  ) {}

  async execute(
    req: CreateOperacionRequest,
    ctx?: TransactionContext,
    tipoAjuste?: TxTipo,
  ): Promise<CreateOperacionResponse> {
    // 1️⃣ Cargar lotes, transacciones y construir Saldo
    const saldoActual =
      (await this.saldoRepo.findByClienteId(req.clienteId)) ??
      new CantidadPuntos(0);
    const lotes = await this.loteRepo.findByCliente(req.clienteId);
    const saldo = new Saldo(req.clienteId, saldoActual, lotes);

    let txsOriginal: Transaccion[] | undefined;

    if (req.tipo != OpTipo.COMPRA && req.tipo != OpTipo.AJUSTE) {
      if (req.operacionId) {
        // Caso anulación: tengo el ID de la operación a revertir
        txsOriginal = await this.txRepo.findByOperationId(
          req.operacionId.value,
        );
      } else if (req.referencia && req.referencia != null) {
        // Caso devolución por referencia de movimiento
        txsOriginal = await this.txRepo.findByReferencia(req.referencia.value!);
        req.operacionId = txsOriginal[0]?.operationId; // Asignar el ID de la operación original
      } else {
        // Ni operacionId ni referencia → no sé qué debo revertir
        throw new RefundError();
      }
    }

    // 2️⃣ Instanciar Operacion
    const opId = OperacionId.create();
    const oper = new Operacion(
      opId,
      req.clienteId,
      req.tipo,
      undefined,
      req.origenTipo,
      req.puntos ? new CantidadPuntos(req.puntos) : undefined,
      req.montoMoneda ? new MontoMoneda(req.montoMoneda) : undefined,
      req.moneda ? Moneda.create(req.moneda) : undefined,
      req.referencia ? req.referencia : undefined,
      req.operacionId ? req.operacionId : undefined,
    );

    // 3️⃣ Obtener instrucciones de reglas (sin mutar Saldo)
    const cambio = await oper.ejecutarEn(saldo, this.reglaEngine);

    // 4️⃣ Aplicar débito y crédito vía handler
    const { detallesDebito, nuevoLote } = await this.saldoHandler.aplicarCambio(
      saldo,
      oper,
      cambio.debitos[0]?.cantidad,
      cambio.creditos[0]
        ? {
            cantidad: cambio.creditos[0].cantidad,
            expiraEn: cambio.creditos[0].expiraEn,
          }
        : undefined,
      txsOriginal,
      tipoAjuste,
      ctx,
    );

    // 5️⃣ Persistir cambios en lotes
    const lotesOrdenados = saldo
      .getLotes()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    for (const lote of lotesOrdenados) {
      if (nuevoLote && lote.id.value === nuevoLote.id.value) continue;
      await this.loteRepo.update(lote, ctx);
    }

    // Guardar SOLO el lote nuevo
    if (nuevoLote) {
      await this.loteRepo.save(nuevoLote, ctx);
    }

    // 6️⃣ Registrar transacciones basadas en consumo y crédito
    const registros: Array<{
      loteId: LoteId;
      tipo: TxTipo;
      cantidad: CantidadPuntos;
    }> = [];

    // Débitos por lote
    for (const d of detallesDebito) {
      registros.push({
        loteId: d.loteId,
        tipo:
          req.tipo !== OpTipo.COMPRA && req.tipo !== OpTipo.AJUSTE
            ? req.tipo === OpTipo.ANULACION
              ? TxTipo.ANULACION
              : TxTipo.DEVOLUCION
            : TxTipo.GASTO,
        cantidad: d.cantidad,
      });
    }
    // Crédito
    if (nuevoLote) {
      registros.push({
        loteId: nuevoLote.id,
        tipo: TxTipo.ACREDITACION,
        cantidad: nuevoLote.cantidadOriginal,
      });
    }

    // Persistir transacciones
    const txs: Transaccion[] = [];
    for (const reg of registros) {
      const dto = {
        operacionId: opId,
        loteId: reg.loteId,
        tipo: reg.tipo,
        cantidad: reg.cantidad,
        fechaCreacion: new Date(),
        referenciaId: req.referencia,
        reglasAplicadas: cambio.reglasAplicadas,
      };
      const tx = this.txFactory.createFromDto(dto);
      await this.txRepo.save(tx, ctx);
      txs.push(tx);
    }

    // Persistir operación
    await this.operacionRepo.save(oper, ctx);

    // 7️⃣ Armar respuesta
    const lotesAfectados = [
      ...detallesDebito.map((d) => d.loteId),
      ...(nuevoLote ? [nuevoLote] : []),
    ];

    return {
      operacionId: opId.value,
      lotesAfectados,
      transacciones: txs.map((t) => ({
        id: t.id.value,
        operacionId: t.operationId.value,
        loteId: t.loteId.value,
        tipo: t.tipo,
        cantidad: t.cantidad.value,
        createdAt: t.createdAt,
      })),
    };
  }
}
