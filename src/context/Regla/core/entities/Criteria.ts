// core/reglas/ReglaCriteria.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { ReglaEngineRequest } from '../interfaces/IReglaEngine';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';
import { ProductoRuleItemDTO } from '../dto/ProductoRuleItemDTO';
import { numberFromMoney, currencyFromMoney } from '../utils/number-helper';

export class ReglaCriteria {
  constructor(
    public readonly fecha: FechaOperacion,
    public readonly tipo: OpTipo,
    public readonly clienteId: string,
    public readonly puntosSolicitados?: CantidadPuntos,
    public readonly monto?: MontoMoneda,
    public readonly moneda?: Moneda,
    public readonly saldoActual?: CantidadPuntos,
    public readonly productos: ProductoRuleItemDTO[] = [], // 🔹 aquí
  ) {}

  public static fromContext(ctx: ReglaEngineRequest): ReglaCriteria {
    const productos = Array.isArray(ctx.productos) ? ctx.productos : [];

    // derivar monto/moneda si no vienen
    let monto = ctx.monto;
    let moneda = ctx.moneda;

    if (!monto && productos.length > 0) {
      const total = productos.reduce(
        (acc, it) =>
          acc + numberFromMoney(it.precio) * Math.max(1, it.cantidad ?? 1),
        0,
      );
      monto = new MontoMoneda(total);

      if (!moneda) {
        const anyCurrency = currencyFromMoney(productos[0].precio);
        if (anyCurrency) {
          try {
            moneda = Moneda.create(anyCurrency);
          } catch {
            /* noop */
          }
        }
      }
    }

    return new ReglaCriteria(
      ctx.fecha,
      ctx.tipo,
      ctx.clienteId,
      ctx.puntosSolicitados,
      monto,
      moneda,
      ctx.saldoActual,
      productos,
    );
  }
}
