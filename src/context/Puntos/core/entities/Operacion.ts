// src/context/Puntos/core/entities/Operacion.ts
import { OpTipo } from '../../../../shared/core/enums/OpTipo';
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
import { OrigenOperacion } from '../value-objects/OrigenOperacion';
import { FechaExpiracion } from '../value-objects/FechaExpiracion';

/**
 * Instrucción de débito: cantidad total de puntos a consumir.
 */
export interface DebitoInstruction {
  cantidad: CantidadPuntos;
}

/**
 * Instrucción de crédito: cantidad de puntos a generar y expiración.
 */
export interface CreditoInstruction {
  cantidad: CantidadPuntos;
  expiraEn?: FechaExpiracion;
}

/**
 * Resultado de ejecutar la operación: instrucciones de débito y crédito.
 */
export interface CambioOperacion {
  debitos: DebitoInstruction[];
  creditos: CreditoInstruction[];
}

export class Operacion {
  constructor(
    private readonly _id: OperacionId,
    private readonly _clienteId: string,
    private readonly _tipo: OpTipo,
    private readonly _fecha: FechaOperacion = new FechaOperacion(new Date()),
    private readonly _origenTipo: OrigenOperacion,
    private readonly _puntos?: CantidadPuntos,
    private readonly _monto?: MontoMoneda,
    private readonly _moneda?: Moneda,
    private readonly _refOperacion?: ReferenciaMovimiento,
    private readonly _refAnulacion?: OperacionId,
  ) {}

  get id(): OperacionId {
    return this._id;
  }

  get clienteId(): string {
    return this._clienteId;
  }

  get tipo(): OpTipo {
    return this._tipo;
  }

  get fecha(): FechaOperacion {
    return this._fecha;
  }

  get origenTipo(): OrigenOperacion {
    return this._origenTipo;
  }

  get puntos(): CantidadPuntos | undefined {
    return this._puntos;
  }

  get monto(): MontoMoneda | undefined {
    return this._monto;
  }

  get moneda(): Moneda | undefined {
    return this._moneda;
  }

  get refOperacion(): ReferenciaMovimiento | undefined {
    return this._refOperacion;
  }

  get refAnulacion(): OperacionId | undefined {
    return this._refAnulacion;
  }

  /**
   * Orquesta la petición al motor de reglas y devuelve instrucciones
   * de débito (cantidad total) y crédito (cantidad + expiración).
   */
  async ejecutarEn(
    saldo: Saldo,
    reglaEngine: IReglaEngine,
  ): Promise<CambioOperacion> {
    const req: ReglaEngineRequest = {
      clienteId: this._clienteId,
      tipo: this._tipo,
      fecha: this._fecha.toDate(),
      puntosSolicitados: this._puntos?.value,
      monto: this._monto?.value,
      moneda: this._moneda?.value,
      saldoActual: saldo.getSaldoActual().value,
    };

    const result: ReglaEngineResult = await reglaEngine.procesar(req);

    const debitos: DebitoInstruction[] = [];
    if (result.debitAmount !== undefined) {
      debitos.push({ cantidad: new CantidadPuntos(result.debitAmount) });
    }

    const creditos: CreditoInstruction[] = [];
    if (result.credito) {
      creditos.push({
        cantidad: new CantidadPuntos(result.credito.cantidad),
        expiraEn: result.credito.expiraEn
          ? new FechaExpiracion(result.credito.expiraEn)
          : undefined,
      });
    }

    return { debitos, creditos };
  }
}
