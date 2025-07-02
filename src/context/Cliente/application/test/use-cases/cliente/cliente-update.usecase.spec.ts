/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteNombre } from '@cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from '@cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from '@cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from '@cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';

describe('ClienteUpdate Use Case', () => {
  let repo: jest.Mocked<ClienteRepository>;
  let categoriaRepo: jest.Mocked<CategoriaRepository>;
  let useCase: ClienteUpdate;
  let existing: Cliente;

  // Creamos una categoría por defecto para el fixture
  const defaultCategoria = new Categoria(
    new CategoriaId('11111111-1111-4111-8111-111111111111'),
    new CategoriaNombre('General'),
    new CategoriaDescripcion(null),
  );

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    categoriaRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // El handler de actualizar ahora recibe ambos repos
    useCase = new ClienteUpdate(repo, categoriaRepo);

    // Mockeamos que cualquier búsqueda de categoría devuelve la default
    categoriaRepo.findById.mockResolvedValue(defaultCategoria);

    // Creamos un Cliente “fixture” completo
    existing = new Cliente(
      new ClienteId('00000000-0000-4000-8000-000000000000'),
      new ClienteDni('11111111'),
      new ClienteNombre('Luis'),
      new ClienteApellido('Ramírez'),
      new ClienteSexo('M'),
      new ClienteFechaNacimiento(new Date('1992-02-02')),
      new ClienteStatus('activo'),
      defaultCategoria,
      // Saldo inicial a cero
    );
  });

  it('lanza ClienteNotFoundError si no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.run({ id: 'no-existe' })).rejects.toBeInstanceOf(
      ClienteNotFoundError,
    );
  });

  it('actualiza sólo el email cuando se suministra', async () => {
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(undefined);

    await useCase.run({ id: existing.id.value, email: 'nuevo@dom.com' });

    expect((existing as any)._email.value).toBe('nuevo@dom.com');
    expect(repo.update).toHaveBeenCalledWith(existing);
  });

  it('puede actualizar múltiples campos', async () => {
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(undefined);

    await useCase.run({
      id: existing.id.value,
      dni: '22222222',
      nombre: 'Pedro',
      telefono: '+54111234567',
    });

    expect((existing as any)._dni.value).toBe('22222222');
    expect((existing as any)._nombre.value).toBe('Pedro');
    expect((existing as any)._telefono.value).toBe('+54111234567');
    expect(repo.update).toHaveBeenCalledWith(existing);
  });
});
