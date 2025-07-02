/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/application/use-cases/cliente-create.usecase.spec.ts

import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { Categoria } from '@cliente/core/entities/Categoria';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { FakeUUIDGen } from '@shared/core/uuid/test/stubs/FakeUUIDGenerator';

describe('ClienteCreate Use Case', () => {
  let idGen: FakeUUIDGen;
  let repo: jest.Mocked<ClienteRepository>;
  let useCase: ClienteCreate;

  const defaultCategoria = new Categoria(
    new CategoriaId('11111111-1111-4111-8111-111111111111'),
    new CategoriaNombre('General'),
    new CategoriaDescripcion('Categoría general de clientes'),
  );

  beforeEach(() => {
    idGen = new FakeUUIDGen();
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ClienteCreate(repo, idGen);
  });

  it('debe invocar repository.create con un Cliente válido', async () => {
    await useCase.run(
      '12345678',
      'Juan',
      'Pérez',
      'M',
      new Date('1990-01-01'),
      'activo',
      defaultCategoria,
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
    expect((clienteArg as any)._id.value).toBe(
      '00000000-0000-4000-8000-000000000000',
    );
    expect((clienteArg as any)._dni.value).toBe('12345678');
    expect((clienteArg as any)._email.value).toBe('juan@dominio.com');
    expect((clienteArg as any)._tarjetaFidely.value).toBe('4567');
  });

  it('debe permitir campos opcionales omitidos', async () => {
    await useCase.run(
      '12345678',
      'Ana',
      'Gómez',
      'F',
      new Date('1985-05-05'),
      'activo',
      defaultCategoria,
      // resto undefined
    );

    expect(repo.create).toHaveBeenCalled();
    const clienteArg = repo.create.mock.calls[0][0];
    expect((clienteArg as any)._email.value).toBeNull();
    expect((clienteArg as any)._direccion.value).toBeNull();
    // En lugar de comparar toda la entidad, comparamos sus VOs internos
    const cat = (clienteArg as any)._categoria as Categoria;
    expect(cat.id.value).toBe(defaultCategoria.id.value);
    expect(cat.nombre.value).toBe(defaultCategoria.nombre.value);
    // si tienes VO para descripción:
    expect(cat.descripcion.value).toBe(defaultCategoria.descripcion.value);
  });
});
