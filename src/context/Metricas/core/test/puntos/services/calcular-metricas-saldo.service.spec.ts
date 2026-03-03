import { CalcularMetricasSaldoService } from 'src/context/Metricas/core/puntos/services/calcularMetricasSaldoService';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';

describe('CalcularMetricasSaldoService', () => {
  let service: CalcularMetricasSaldoService;

  beforeEach(() => {
    service = new CalcularMetricasSaldoService();
  });

  it('calcula saldo total, usuarios con saldo y promedio', () => {
    const saldos = [
      { clienteId: '1', puntos: new CantidadPuntos(100) },
      { clienteId: '2', puntos: new CantidadPuntos(0) },
      { clienteId: '3', puntos: new CantidadPuntos(300) },
    ];

    const result = service.run(saldos, 5);

    expect(result.saldoTotal).toBe(400);
    expect(result.usuariosConSaldo).toBe(2);
    expect(result.promedioPorUsuario).toBe(200);
    expect(result.totalUsuarios).toBe(5);
    expect(result.porcentajeUsuariosConSaldo()).toBe(40);
  });

  it('retorna promedio 0 cuando no hay usuarios con saldo', () => {
    const saldos = [
      { clienteId: '1', puntos: new CantidadPuntos(0) },
      { clienteId: '2', puntos: new CantidadPuntos(0) },
    ];

    const result = service.run(saldos, 2);

    expect(result.promedioPorUsuario).toBe(0);
    expect(result.usuariosConSaldo).toBe(0);
  });
});
