// src/application/services/TransaccionBuilder.ts
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Lote } from '@puntos/core/entities/Lote';
import { CreateOperacionRequest } from '@puntos/application/dtos/CreateOperacionRequest';
import { TransaccionFactory } from '@puntos/core/factories/TransaccionFactory';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Inject, Injectable } from '@nestjs/common';
import { TX_FACTORY } from '@puntos/core/tokens/tokens';
import { DetalleTransaccion } from '../handlers/SaldoHandler';

@Injectable()
export class TransaccionBuilder {
  constructor(
    @Inject(TX_FACTORY) private readonly txFactory: TransaccionFactory,
  ) {}

  buildTransacciones(
    detallesDebito: DetalleTransaccion[],
    nuevoLote: Lote | undefined,
    operacion: Operacion,
    req: CreateOperacionRequest,
    reglasAplicadas: Record<string, { id: string; nombre: string }[]>,
  ) {
    const registros = [
      ...detallesDebito.map((d) => ({
        operacionId: operacion.id,
        loteId: d.loteId,
        tipo: d.tipo,
        cantidad: d.cantidad,
        fechaCreacion: new Date(),
        referenciaId: req.referencia,
        reglasAplicadas,
      })),
      ...(nuevoLote
        ? [
            {
              operacionId: operacion.id,
              loteId: nuevoLote.id,
              tipo: TxTipo.ACREDITACION,
              cantidad: nuevoLote.cantidadOriginal,
              fechaCreacion: new Date(),
              referenciaId: req.referencia,
              reglasAplicadas,
            },
          ]
        : []),
    ];

    return registros.map((dto) => this.txFactory.createFromDto(dto));
  }
}
