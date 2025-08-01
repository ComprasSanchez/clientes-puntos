// src/application/services/TransaccionBuilder.ts
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { CreateOperacionRequest } from '@puntos/application/dtos/CreateOperacionRequest';
import { TransaccionFactory } from '@puntos/core/factories/TransaccionFactory';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Inject, Injectable } from '@nestjs/common';
import { TX_FACTORY } from '@puntos/core/tokens/tokens';

interface DetalleDebito {
  loteId: LoteId;
  cantidad: CantidadPuntos;
}

@Injectable()
export class TransaccionBuilder {
  constructor(
    @Inject(TX_FACTORY) private readonly txFactory: TransaccionFactory,
  ) {}

  buildTransacciones(
    tipoOperacion: OpTipo,
    detallesDebito: DetalleDebito[],
    nuevoLote: Lote | undefined,
    operacion: Operacion,
    req: CreateOperacionRequest,
    reglasAplicadas: Record<string, { id: string; nombre: string }[]>,
  ) {
    // Mapeo segun tipo
    let debitoTipo: TxTipo;
    switch (tipoOperacion) {
      case OpTipo.ANULACION:
        debitoTipo = TxTipo.ANULACION;
        break;
      case OpTipo.DEVOLUCION:
        debitoTipo = TxTipo.DEVOLUCION;
        break;
      case OpTipo.COMPRA:
      case OpTipo.AJUSTE:
      default:
        debitoTipo = TxTipo.GASTO;
        break;
    }

    const registros = [
      ...detallesDebito.map((d) => ({
        operacionId: operacion.id,
        loteId: d.loteId,
        tipo: debitoTipo,
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
