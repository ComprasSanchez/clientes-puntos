/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ClienteDelete } from '../../use-cases/ClienteDelete/ClienteDelete';
import { ClienteRepository } from 'src/context/Cliente/core/Repository/ClienteRepository';
import { ClienteNotFoundError } from 'src/context/Cliente/core/Exceptions/ClienteNotFoundError';
import { Cliente } from 'src/context/Cliente/core/Cliente';
import { ClienteId } from 'src/context/Cliente/core/ValueObjects/ClienteId';
import { ClienteDni } from 'src/context/Cliente/core/ValueObjects/ClienteDni';
import { ClienteNombre } from 'src/context/Cliente/core/ValueObjects/ClienteNombre';
import { ClienteApellido } from 'src/context/Cliente/core/ValueObjects/ClienteApellido';
import { ClienteSexo } from 'src/context/Cliente/core/ValueObjects/ClienteSexo';
import { ClienteFechaNacimiento } from 'src/context/Cliente/core/ValueObjects/ClienteFechaNacimiento';
import {
  ClienteStatus,
  StatusCliente,
} from 'src/context/Cliente/core/ValueObjects/ClienteStatus';

describe('ClienteDelete (soft delete) Use Case', () => {
  let repo: jest.Mocked<ClienteRepository>;
  let useCase: ClienteDelete;
  let existing: Cliente;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ClienteDelete(repo);

    existing = new Cliente(
      new ClienteId('00000000-0000-4000-8000-000000000000'),
      new ClienteDni('33333333'),
      new ClienteNombre('María'),
      new ClienteApellido('López'),
      new ClienteSexo('F'),
      new ClienteFechaNacimiento(new Date('1995-03-03')),
      new ClienteStatus('activo'),
    );
  });

  it('lanza ClienteNotFoundError si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.run('no-existe')).rejects.toBeInstanceOf(
      ClienteNotFoundError,
    );
  });

  it('marca como inactivo y persiste el soft delete', async () => {
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(undefined);

    await useCase.run(existing.id.value);

    // status debe ser INACTIVO
    expect((existing as any)._status.value).toBe(StatusCliente.Inactivo);
    // fechaBaja debe haberse asignado
    expect((existing as any)._fechaBaja.value).toBeInstanceOf(Date);
    // repo.update debe haberse llamado con el mismo agregado
    expect(repo.update).toHaveBeenCalledWith(existing);
  });
});
