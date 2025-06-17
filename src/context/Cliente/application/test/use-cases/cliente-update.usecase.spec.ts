/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';
import { ClienteUpdate } from '../../use-cases/ClienteUpdate/ClienteUpdate';
import { ClienteNotFoundError } from 'src/context/Cliente/core/exceptions/ClienteNotFoundError';
import { Cliente } from 'src/context/Cliente/core/entities/Cliente';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { ClienteDni } from 'src/context/Cliente/core/value-objects/ClienteDni';
import { ClienteNombre } from 'src/context/Cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from 'src/context/Cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from 'src/context/Cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from 'src/context/Cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from 'src/context/Cliente/core/value-objects/ClienteStatus';

describe('ClienteUpdate Use Case', () => {
  let repo: jest.Mocked<ClienteRepository>;
  let useCase: ClienteUpdate;
  let existing: Cliente;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ClienteUpdate(repo);

    // Creamos un Cliente “fixture” rápido
    existing = new Cliente(
      new ClienteId('00000000-0000-4000-8000-000000000000'),
      new ClienteDni('11111111'),
      new ClienteNombre('Luis'),
      new ClienteApellido('Ramírez'),
      new ClienteSexo('M'),
      new ClienteFechaNacimiento(new Date('1992-02-02')),
      new ClienteStatus('activo'),
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
    expect(repo.update).toHaveBeenCalled();
  });
});
