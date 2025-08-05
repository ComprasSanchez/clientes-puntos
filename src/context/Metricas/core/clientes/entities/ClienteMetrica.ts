// /metricas/domain/clientes/entities/ClienteMetrica.ts

import { OpTipo } from '@shared/core/enums/OpTipo';

export class ClienteMetrica {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly fecha: Date,
    public readonly pesosAhorro: number,
    public readonly puntosAdquiridos: number,
    public readonly movimientos: number,
    public readonly tipoOperacion: OpTipo,
    public readonly referenciaTransaccion?: string,
  ) {}

  // Puedes agregar lógica de dominio si querés (ej: validaciones)
}
