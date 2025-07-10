import { OpTipo } from '@shared/core/enums/OpTipo';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { OperacionId } from '../value-objects/OperacionId';

// src/domain/entities/HistorialSaldo.ts
export class HistorialSaldo {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly saldoAnterior: CantidadPuntos,
    public readonly saldoNuevo: CantidadPuntos,
    public readonly motivo: OpTipo,
    public readonly referenciaOperacion: OperacionId | undefined,
    public readonly fechaCambio: Date,
  ) {}
}
