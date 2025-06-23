/* eslint-disable @typescript-eslint/unbound-method */
// __tests__/PuntosServiceInMemory.spec.ts
import { ObtenerSaldo } from 'src/context/Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { PuntosServiceInMemory } from './PuntosServiceInMemory';

describe('PuntosServiceInMemory', () => {
  let obtenerSaldoMock: jest.Mocked<ObtenerSaldo>;
  let service: PuntosServiceInMemory;

  beforeEach(() => {
    // Creamos un stub/mock de la clase ObtenerSaldo
    obtenerSaldoMock = {
      run: jest.fn(), // reemplazamos el método run
    } as unknown as jest.Mocked<ObtenerSaldo>;

    // Inyectamos el mock en nuestro service
    service = new PuntosServiceInMemory(obtenerSaldoMock);
  });

  it('debe llamar a ObtenerSaldo.run con el clienteId y devolver su resultado', async () => {
    // Preparamos el mock para que devuelva 250 al resolver
    obtenerSaldoMock.run.mockResolvedValue(250);

    const clienteId = 'cliente-123';
    const saldo = await service.obtenerSaldoActual(clienteId);

    // Verificamos que se llamó correctamente
    expect(obtenerSaldoMock.run).toHaveBeenCalledTimes(1);
    expect(obtenerSaldoMock.run).toHaveBeenCalledWith(clienteId);

    // Y que devolvió lo que esperábamos
    expect(saldo).toBe(250);
  });
});
