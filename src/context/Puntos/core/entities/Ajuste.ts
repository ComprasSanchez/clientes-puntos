import { TxTipo } from '../enums/TxTipo';

// ajuste/Ajuste.ts
export class Ajuste {
  constructor(
    public readonly id: string, // UUID generado
    public readonly usuarioId: string,
    public readonly clienteId: string,
    public readonly tipo: TxTipo,
    public readonly cantidad: number,
    public readonly fecha: Date,
    public readonly motivo?: string,
  ) {}
}
