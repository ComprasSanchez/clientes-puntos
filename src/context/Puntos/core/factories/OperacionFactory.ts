// @puntos/core/factories/OperacionFactory.ts
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { MontoMoneda } from '@puntos/core/value-objects/MontoMoneda';
import { Moneda } from '@puntos/core/value-objects/Moneda';
import { CreateOperacionRequest } from '@puntos/application/dtos/CreateOperacionRequest';

export class OperacionFactory {
  create(req: CreateOperacionRequest): Operacion {
    return new Operacion(
      OperacionId.create(),
      req.clienteId,
      req.tipo,
      undefined,
      req.origenTipo,
      req.puntos ? new CantidadPuntos(req.puntos) : undefined,
      req.montoMoneda ? new MontoMoneda(req.montoMoneda) : undefined,
      req.moneda ? Moneda.create(req.moneda) : undefined,
      req.referencia ?? undefined,
      req.operacionId ?? undefined,
      req.codSucursal ?? undefined,
    );
  }
}
