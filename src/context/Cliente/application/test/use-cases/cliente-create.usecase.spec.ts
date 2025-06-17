/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
// test/application/use-cases/cliente-create.usecase.spec.ts

import { ClienteRepository } from 'src/context/Cliente/core/Repository/ClienteRepository';
import { ClienteCreate } from '../../use-cases/ClienteCreate/ClienteCreate';

describe('ClienteCreate Use Case', () => {
  let repo: jest.Mocked<ClienteRepository>;
  let useCase: ClienteCreate;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ClienteCreate(repo);
  });

  it('debe invocar repository.create con un Cliente válido', async () => {
    await useCase.run(
      '00000000-0000-4000-8000-000000000000',
      '12345678',
      'Juan',
      'Pérez',
      'M',
      new Date('1990-01-01'),
      'activo',
      'juan@dominio.com',
      '+541234567890',
      'Calle Falsa 123',
      '1234',
      'Buenos Aires',
      'Buenos Aires',
      'FID123',
      '4567',
    );

    expect(repo.create).toHaveBeenCalledTimes(1);
    const clienteArg = repo.create.mock.calls[0][0];
    expect(clienteArg).toBeInstanceOf(Object);
    // comprueba algunos campos internos:
    expect((clienteArg as any)._dni.value).toBe('12345678');
    expect((clienteArg as any)._email.value).toBe('juan@dominio.com');
    expect((clienteArg as any)._tarjetaFidely.value).toBe('4567');
  });

  it('debe permitir campos opcionales omitidos', async () => {
    await useCase.run(
      '00000000-0000-4000-8000-000000000000',
      '12345678',
      'Ana',
      'Gómez',
      'F',
      new Date('1985-05-05'),
      'activo',
      // resto undefined
    );

    expect(repo.create).toHaveBeenCalled();
    const clienteArg = repo.create.mock.calls[0][0];
    expect((clienteArg as any)._email.value).toBeNull();
    expect((clienteArg as any)._direccion.value).toBeNull();
    expect((clienteArg as any)._categoria.value).toBe('General');
  });
});
