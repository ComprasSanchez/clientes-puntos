// src/context/cliente/domain/entities/Saldo.ts

import { ClienteId } from '../value-objects/ClienteId';
import { PuntosOperacion } from '../value-objects/PuntosOperacion';
import { SaldoActual } from '../value-objects/SaldoActual';

export class Saldo {
  private readonly _clienteId: ClienteId;
  private _saldoActual: SaldoActual;
  private _updatedAt: Date;

  constructor(clienteId: ClienteId, saldoActual: SaldoActual, updatedAt: Date) {
    this._clienteId = clienteId;
    this._saldoActual = saldoActual;
    this._updatedAt = updatedAt;
  }

  /** Identidad: siempre es el mismo ClienteId */
  get clienteId(): ClienteId {
    return this._clienteId;
  }

  /** Saldo actual de puntos */
  get saldoActual(): SaldoActual {
    return this._saldoActual;
  }

  /** Última actualización */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  acumular(puntos: PuntosOperacion): void {
    const nuevoValor = this._saldoActual.value + puntos.value;
    this._saldoActual = new SaldoActual(nuevoValor);
    this.touch();
  }

  gastar(puntos: PuntosOperacion): void {
    // Regla de negocio: no gastar más de lo que hay
    if (puntos.value > this._saldoActual.value) {
      throw new Error(
        `Saldo insuficiente: intenta gastar ${puntos.value}, pero solo hay ${this._saldoActual.value}.`,
      );
    }
    // Nuevo valor = valor actual − puntos
    const nuevoValor = this._saldoActual.value - puntos.value;
    this._saldoActual = new SaldoActual(nuevoValor);
    this.touch();
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
