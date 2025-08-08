// @puntos/core/entities/Operacion.ts
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
import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { MonedaNotFoundError } from '../exceptions/Operacion/MonedaNotFoundError';
import { OperacionPrimitives } from '../interfaces/OperacionPrimitives';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';

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
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
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
    private readonly _codSucursal?: string,
  ) {
    // ——— Validaciones de invariante ———
    // 1) Debe venir al menos puntos o monto
    if (this._tipo !== OpTipo.ANULACION && !this._puntos && !this._monto) {
      throw new MonedaNotFoundError('Puntos - Monto');
    }
    // 2) Si se especifica monto, debe venir moneda
    if (this._monto && !this._moneda) {
      throw new FieldRequiredError('Moneda');
    }
    // ——————————————————————————
  }

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

  get codSucursal(): string | undefined {
    return this._codSucursal;
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

    const reglasAplicadas = result.reglasAplicadas || {};

    return { debitos, creditos, reglasAplicadas };
  }

  static fromPrimitives(obj: OperacionPrimitives): Operacion {
    const id = OperacionId.instance(obj._id);
    const clienteId = obj._clienteId;
    const tipo = obj._tipo;
    const fecha = obj._fecha
      ? new FechaOperacion(new Date(obj._fecha))
      : new FechaOperacion(new Date());
    const origenTipo = new OrigenOperacion(obj._origenTipo);
    const puntos =
      obj._puntos !== undefined ? new CantidadPuntos(obj._puntos) : undefined;
    const monto =
      obj._monto !== undefined ? new MontoMoneda(obj._monto) : undefined;
    const moneda = obj._moneda
      ? Moneda.create(obj._moneda as TipoMoneda)
      : undefined; // Si tenés un factory
    const refOperacion = obj._refOperacion
      ? new ReferenciaMovimiento(obj._refOperacion)
      : undefined;
    const refAnulacion = obj._refAnulacion
      ? OperacionId.instance(obj._refAnulacion)
      : undefined;
    const codSucursal = obj._codSucursal;

    return new Operacion(
      id,
      clienteId,
      tipo,
      fecha,
      origenTipo,
      puntos,
      monto,
      moneda,
      refOperacion,
      refAnulacion,
      codSucursal,
    );
  }

  toPrimitives(): OperacionPrimitives {
    return {
      _id: this._id.value,
      _clienteId: this._clienteId,
      _tipo: this._tipo,
      _fecha: this._fecha.value.toISOString(),
      _origenTipo: this._origenTipo.value,
      _puntos: this._puntos?.value,
      _monto: this._monto?.value,
      _moneda: this._moneda?.value,
      _refOperacion: this._refOperacion?.value,
      _refAnulacion: this._refAnulacion?.value,
      _codSucursal: this._codSucursal,
    };
  }
}
