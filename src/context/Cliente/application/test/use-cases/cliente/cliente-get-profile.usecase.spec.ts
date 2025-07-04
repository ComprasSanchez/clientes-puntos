/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// __tests__/ClienteGetProfile.spec.ts
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { IPuntosService } from '@cliente/application/ports/IPuntosService';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteProfileDto } from '@cliente/application/dtos/ClienteProfileDto'; // ajusta según tu estructura
import { ClienteGetProfile } from '@cliente/application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteNombre } from '@cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from '@cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from '@cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from '@cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteEmail } from '@cliente/core/value-objects/ClienteEmail';
import { ClienteTelefono } from '@cliente/core/value-objects/ClienteTelefono';
import { ClienteDireccion } from '@cliente/core/value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from '@cliente/core/value-objects/ClienteCodPostal';
import { ClienteLocalidad } from '@cliente/core/value-objects/ClienteLocalidad';
import { ClienteProvincia } from '@cliente/core/value-objects/ClienteProvincia';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteFechaBaja } from '@cliente/core/value-objects/ClienteFechaBaja';
import { StatusCliente } from '@cliente/core/enums/StatusCliente';

describe('ClienteGetProfile', () => {
  let repoMock: jest.Mocked<ClienteRepository>;
  let puntosMock: jest.Mocked<IPuntosService>;
  let useCase: ClienteGetProfile;

  beforeEach(() => {
    repoMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    puntosMock = {
      obtenerSaldoActual: jest.fn(),
    };

    useCase = new ClienteGetProfile(repoMock, puntosMock);
  });

  it('lanza ClienteNotFoundError si no existe el cliente', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(useCase.run('no-existe')).rejects.toThrow(
      new ClienteNotFoundError('no-existe'),
    );

    expect(repoMock.findById).toHaveBeenCalledWith(new ClienteId('no-existe'));
    expect(puntosMock.obtenerSaldoActual).not.toHaveBeenCalled();
  });

  it('mapea correctamente un Cliente y devuelve ClienteProfileDto', async () => {
    // 1️⃣ Construyo un Cliente de dominio con sólo los VOs obligatorios
    const categoriaDom = new Categoria(
      new CategoriaId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54'),
      new CategoriaNombre('Gold'),
    );
    const clienteDom = new Cliente(
      new ClienteId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54'),
      new ClienteDni('12345678'),
      new ClienteNombre('Juan'),
      new ClienteApellido('Pérez'),
      new ClienteSexo('M'),
      new ClienteFechaNacimiento(new Date('1990-02-15')),
      new ClienteStatus(StatusCliente.Activo),
      categoriaDom,
      new ClienteEmail('juan.perez@example.com'),
      new ClienteTelefono('5551234'),
      new ClienteDireccion('Calle Falsa 123'),
      new ClienteCodigoPostal('1000'),
      new ClienteLocalidad('Ciudad'),
      new ClienteProvincia('Provincia'),
      new ClienteIdFidely('fid-999'),
      new ClienteTarjetaFidely('1234567891231554'),
      new ClienteFechaBaja(null),
    );
    // Saldo que devolverá el mock
    puntosMock.obtenerSaldoActual.mockResolvedValue(425);
    repoMock.findById.mockResolvedValue(clienteDom);

    const result = await useCase.run('c-123');

    // 2️⃣ Compruebo campos estáticos
    expect(result).toMatchObject<Partial<ClienteProfileDto>>({
      id: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      dni: '12345678',
      nombre: 'Juan',
      apellido: 'Pérez',
      sexo: 'M',
      fechaNacimiento: new Date('1990-02-15').toISOString(),
      status: 'activo',
      categoria: 'Gold',
      email: 'juan.perez@example.com',
      telefono: '5551234',
      direccion: 'Calle Falsa 123',
      codPostal: '1000',
      localidad: 'Ciudad',
      provincia: 'Provincia',
      idFidely: 'fid-999',
      tarjetaFidely: '1234567891231554',
      fechaBaja: null,
      saldoActual: 425,
    });

    // 3️⃣ Compruebo campos de fecha dinámicos
    // Deben ser ISO strings válidos y createdAt === updatedAt
    expect(typeof result.createdAt).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
    expect(Date.parse(result.createdAt)).not.toBeNaN();
    expect(Date.parse(result.updatedAt)).not.toBeNaN();
    expect(result.createdAt).toEqual(result.updatedAt);

    // Y que llamó a las dependencias con los parámetros correctos
    expect(repoMock.findById).toHaveBeenCalledWith(
      new ClienteId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54'),
    );
    expect(puntosMock.obtenerSaldoActual).toHaveBeenCalledWith(
      '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
    );
  });
});
