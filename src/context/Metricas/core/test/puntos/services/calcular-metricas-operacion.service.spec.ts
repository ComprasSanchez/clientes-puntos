import { CalcularMetricasOperacionService } from 'src/context/Metricas/core/puntos/services/calcularMetricasOperacionService';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';

describe('CalcularMetricasOperacionService', () => {
  let service: CalcularMetricasOperacionService;

  beforeEach(() => {
    service = new CalcularMetricasOperacionService();
  });

  it('acumula distribucion por tipo y puntos acreditados/gastados', () => {
    const ops = [
      { tipo: OpTipo.COMPRA },
      { tipo: OpTipo.DEVOLUCION },
      { tipo: OpTipo.ANULACION },
      { tipo: OpTipo.AJUSTE },
      { tipo: OpTipo.COMPRA },
    ] as Operacion[];

    const txs = [
      { tipo: TxTipo.ACREDITACION, cantidad: new CantidadPuntos(30) },
      { tipo: TxTipo.ACREDITACION, cantidad: new CantidadPuntos(10) },
      { tipo: TxTipo.GASTO, cantidad: new CantidadPuntos(12) },
    ] as Transaccion[];

    const result = service.calcular(ops, txs, new Date('2026-03-01T00:00:00Z'));

    expect(result.cantidadOperaciones).toBe(5);
    expect(result.puntosAcreditados).toBe(40);
    expect(result.puntosGastados).toBe(12);
    expect(result.distribucionOperaciones).toEqual({
      compra: 2,
      devolucion: 1,
      anulacion: 1,
      ajuste: 1,
    });
  });

  it('retorna metricas en cero cuando no hay datos', () => {
    const result = service.calcular([], [], new Date('2026-03-01T00:00:00Z'));

    expect(result.cantidadOperaciones).toBe(0);
    expect(result.puntosAcreditados).toBe(0);
    expect(result.puntosGastados).toBe(0);
    expect(result.distribucionOperaciones).toEqual({
      compra: 0,
      devolucion: 0,
      anulacion: 0,
      ajuste: 0,
    });
  });
});
