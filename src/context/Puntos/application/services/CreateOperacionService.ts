// src/application/services/CreateOperacionService.ts
import { Saldo } from 'src/context/Puntos/core/entities/Saldo';
import { Operacion } from 'src/context/Puntos/core/entities/Operacion';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { MontoMoneda } from 'src/context/Puntos/core/value-objects/MontoMoneda';
import { Moneda } from 'src/context/Puntos/core/value-objects/Moneda';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';
import { LoteFactory } from 'src/context/Puntos/core/factories/LoteFactory';
import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { IReglaEngine } from 'src/context/Puntos/core/interfaces/IReglaEngine';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { TransaccionFactory } from '../../core/factories/TransaccionFactory';
import { CreateTransaccionDto } from '../dtos/CreateTransaccionDto';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../dtos/CreateOperacionResponse';
import { Lote } from '../../core/entities/Lote';
import { LoteId } from '../../core/value-objects/LoteId';
import { Transaccion } from '../../core/entities/Transaccion';
import { OpTipo } from '../../core/enums/OpTipo';

export class CreateOperacionService {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly txRepo: TransaccionRepository,
    private readonly reglaEngine: IReglaEngine,
    private readonly loteFactory: LoteFactory,
    private readonly txFactory: TransaccionFactory,
  ) {}

  /**
   * Orquesta una operación y persiste los resultados:
   * - consume y crea lotes
   * - genera y guarda transacciones
   */
  async execute(req: CreateOperacionRequest): Promise<CreateOperacionResponse> {
    // 1️⃣ Cargar lotes y construir Saldo
    const lotesExistentes = await this.loteRepo.findByCliente(req.clienteId);
    const saldo = new Saldo(req.clienteId, lotesExistentes);

    // 2️⃣ Instanciar Operacion pura
    const opId = OperacionId.create();
    const puntosVO =
      req.puntos !== undefined ? new CantidadPuntos(req.puntos) : undefined;
    const montoVO =
      req.montoMoneda !== undefined
        ? new MontoMoneda(req.montoMoneda)
        : undefined;
    const monedaVO = req.moneda ? Moneda.create(req.moneda) : undefined;
    const refVO = req.referencia
      ? new ReferenciaMovimiento(req.referencia)
      : undefined;

    const oper = new Operacion(
      opId,
      req.clienteId,
      req.tipo,
      undefined,
      req.origenTipo,
      puntosVO,
      montoVO,
      monedaVO,
      refVO,
    );

    // 3️⃣ Ejecutar dominio y obtener instrucciones
    const cambio = await oper.ejecutarEn(saldo, this.reglaEngine);

    // 4️⃣ Aplicar débitos (consumo de lotes existentes)
    for (const inst of cambio.debitos) {
      const lote = saldo.obtenerLote(inst.loteId)!;
      if (req.tipo === OpTipo.DEVOLUCION || req.tipo === OpTipo.ANULACION) {
        // En devoluciones o anulaciones, devolvemos puntos al lote
        lote.revertir(inst.cantidad);
      } else {
        // En compras con puntos, consumimos
        lote.consumir(inst.cantidad);
      }
      await this.loteRepo.update(lote);
    }

    // 5️⃣ Aplicar créditos (crear nuevos lotes)
    const nuevosLotes: Lote[] = [];
    for (const inst of cambio.creditos) {
      const loteNuevo = this.loteFactory.crear({
        clienteId: req.clienteId,
        cantidad: inst.cantidad,
        origen: inst.origen,
        referencia: inst.referencia,
        expiraEn: inst.expiraEn,
      });
      await this.loteRepo.save(loteNuevo);
      nuevosLotes.push(loteNuevo);
    }

    // 6️⃣ Persistir transacciones
    const txs: Transaccion[] = [];
    let idxCred = 0;
    for (const txInfo of cambio.transacciones) {
      const loteId =
        txInfo.tipo === TxTipo.ACREDITACION
          ? nuevosLotes[idxCred++].id.value
          : txInfo.loteId;

      const dto: CreateTransaccionDto = {
        operacionId: opId,
        loteId: new LoteId(loteId),
        tipo: txInfo.tipo,
        cantidad: txInfo.cantidad,
        fechaCreacion: txInfo.fecha.toDate(),
        referenciaId: txInfo.referencia,
      };
      const tx = this.txFactory.createFromDto(dto);
      await this.txRepo.save(tx);
      txs.push(tx);
    }

    // 7️⃣ Devolver respuesta
    return {
      operacionId: opId.value,
      lotesAfectados: [
        ...cambio.debitos.map((d) => d.loteId),
        ...nuevosLotes.map((l) => l.id.value),
      ],
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
