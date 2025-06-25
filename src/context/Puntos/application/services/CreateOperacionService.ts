// src/application/services/CreateOperacionService.ts
import { Saldo } from 'src/context/Puntos/core/entities/Saldo';
import { Operacion } from 'src/context/Puntos/core/entities/Operacion';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { MontoMoneda } from 'src/context/Puntos/core/value-objects/MontoMoneda';
import { Moneda } from 'src/context/Puntos/core/value-objects/Moneda';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../dtos/CreateOperacionResponse';
import { TransaccionFactory } from 'src/context/Puntos/core/factories/TransaccionFactory';
import { LoteFactory } from 'src/context/Puntos/core/factories/LoteFactory';
import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { IReglaEngine } from 'src/context/Puntos/core/interfaces/IReglaEngine';
import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { LoteId } from '../../core/value-objects/LoteId';
import { Transaccion } from '../../core/entities/Transaccion';

export class CreateOperacionService {
  constructor(
    private readonly loteRepo: LoteRepository,
    private readonly txRepo: TransaccionRepository,
    private readonly reglaEngine: IReglaEngine,
    private readonly loteFactory: LoteFactory,
    private readonly txFactory: TransaccionFactory,
  ) {}

  async execute(req: CreateOperacionRequest): Promise<CreateOperacionResponse> {
    // 1️⃣ Cargar lotes y construir Saldo
    const lotes = await this.loteRepo.findByCliente(req.clienteId);
    const saldo = new Saldo(req.clienteId, lotes);

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
    );

    // 3️⃣ Obtener instrucciones de reglas (sin mutar Saldo)
    const cambio = await oper.ejecutarEn(saldo, this.reglaEngine);

    // 4️⃣ Aplicar DÉBITO: consumir puntos y persistir lotes
    if (cambio.debitos.length > 0) {
      // Asumimos un solo instruct. con cantidad total
      const totalDebitar = cambio.debitos[0].cantidad;
      saldo.consumirPuntos(totalDebitar);
      for (const lote of saldo.getLotes()) {
        await this.loteRepo.update(lote); //canbiar por batch update
      }
    }

    // 5️⃣ Aplicar CRÉDITO: crear y persistir nuevo lote
    let nuevoLoteId: LoteId | undefined;
    if (cambio.creditos.length > 0) {
      const cred = cambio.creditos[0];
      const loteNuevo = this.loteFactory.crear({
        clienteId: req.clienteId,
        cantidad: cred.cantidad,
        origen: req.origenTipo,
        referencia: req.referencia,
        expiraEn: cred.expiraEn,
      });
      await this.loteRepo.save(loteNuevo);
      nuevoLoteId = loteNuevo.id;
    }

    // 6️⃣ Registrar transacciones basadas en consumo y crédito
    const registros: Array<{
      loteId: LoteId;
      tipo: TxTipo;
      cantidad: CantidadPuntos;
    }> = [];

    // Débitos por lote
    const detalles = saldo.getDetalleConsumo();
    for (const d of detalles) {
      registros.push({
        loteId: d.loteId,
        tipo: req.tipo !== OpTipo.COMPRA ? TxTipo.DEVOLUCION : TxTipo.GASTO,
        cantidad: d.cantidad,
      });
    }
    // Crédito
    if (nuevoLoteId) {
      registros.push({
        loteId: nuevoLoteId,
        tipo: TxTipo.ACREDITACION,
        cantidad: cambio.creditos[0].cantidad,
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
      };
      const tx = this.txFactory.createFromDto(dto);
      await this.txRepo.save(tx);
      txs.push(tx);
    }

    // 7️⃣ Armar respuesta
    const lotesAfectados = [
      ...detalles.map((d) => d.loteId),
      ...(nuevoLoteId ? [nuevoLoteId] : []),
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
