// src/context/Puntos/core/entities/Operacion.ts
import { OpTipo } from '../enums/OpTipo';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';
import { OperacionId } from '../value-objects/OperacionId';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import {
  IReglaEngine,
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';
import { Saldo } from './Saldo';
import { TxTipo } from '../enums/TxTipo';

/**
 * Instrucción de débito: lote y cantidad a consumir
 */
export interface DebitoInstruction {
  loteId: string;
  cantidad: CantidadPuntos;
}

/**
 * Instrucción de crédito: cantidad a generar y vencimiento
 */
export interface CreditoInstruction {
  cantidad: CantidadPuntos;
  expiraEn: FechaOperacion;
  origen: OpTipo;
  referencia?: ReferenciaMovimiento;
}

/**
 * Resultado de ejecutar la operación: instrucciones para debitar,
 * para acreditar y detalle de transacciones base a registrar.
 * Las entidades Lote y Transaccion se crearán fuera de este método.
 */
export interface CambioOperacion {
  debitos: DebitoInstruction[];
  creditos: CreditoInstruction[];
  transacciones: Array<{
    // para registrar la traza de transacciones
    operacionId: OperacionId;
    loteId: string;
    tipo: TxTipo;
    cantidad: CantidadPuntos;
    fecha: FechaOperacion;
    referencia?: ReferenciaMovimiento;
  }>;
}

export class Operacion {
  constructor(
    private readonly _id: OperacionId,
    private readonly _clienteId: string,
    private readonly _tipo: OpTipo,
    private readonly _fecha: FechaOperacion = new FechaOperacion(new Date()),
    private readonly _puntos?: CantidadPuntos,
    private readonly _monto?: MontoMoneda,
    private readonly _moneda?: Moneda,
    private readonly _refOperacion?: ReferenciaMovimiento,
  ) {}

  /**
   * Orquesta la petición al motor de reglas y devuelve instrucciones
   * para debitar puntos, acreditar puntos y registrar transacciones.
   */
  async ejecutarEn(
    saldo: Saldo,
    reglaEngine: IReglaEngine,
  ): Promise<CambioOperacion> {
    // 1️⃣ Construir request para el motor de reglas
    const req: ReglaEngineRequest = {
      operacionId: this._id.value,
      clienteId: this._clienteId,
      tipo: this._tipo,
      fecha: this._fecha.toDate(),
      puntosSolicitados: this._puntos?.value,
      monto: this._monto?.value,
      moneda: this._moneda?.value,
      saldoActual: saldo.getSaldoActual().value,
      lotesDisponibles: saldo.getLotes().map((l) => ({
        loteId: l.id.value,
        remaining: l.remaining.value,
        expiraEn: l.expiraEn?.value,
      })),
    };

    // 2️⃣ Invocar el motor de reglas
    const result: ReglaEngineResult = await reglaEngine.procesar(req);

    // 3️⃣ Crear instrucciones de débito y crédito y transacciones base
    const debitos: DebitoInstruction[] = result.debitos.map((d) => ({
      loteId: d.loteId,
      cantidad: new CantidadPuntos(d.cantidad),
    }));

    const creditos: CreditoInstruction[] = result.credito
      ? [
          {
            cantidad: new CantidadPuntos(result.credito.cantidad),
            expiraEn: new FechaOperacion(result.credito.expiraEn),
            origen: this._tipo,
            referencia: this._refOperacion,
          },
        ]
      : [];

    // 4️⃣ Transacciones descriptivas (sin crear la entidad Transaccion)
    const transacciones = [
      ...debitos.map((d) => ({
        operacionId: this._id,
        loteId: d.loteId,
        tipo: TxTipo.GASTO,
        cantidad: d.cantidad,
        fecha: this._fecha,
        referencia: this._refOperacion,
      })),
      ...creditos.map((c) => ({
        operacionId: this._id,
        loteId: '', // se asignará al crear el lote en el servicio
        tipo: TxTipo.ACREDITACION,
        cantidad: c.cantidad,
        fecha: this._fecha,
        referencia: this._refOperacion,
      })),
    ];

    return { debitos, creditos, transacciones };
  }
}
