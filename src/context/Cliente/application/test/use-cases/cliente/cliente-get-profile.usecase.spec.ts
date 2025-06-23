/* eslint-disable @typescript-eslint/unbound-method */
// __tests__/ClienteGetProfile.spec.ts
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';
import { IPuntosService } from 'src/context/Cliente/application/ports/IPuntosService';
import { ClienteNotFoundError } from 'src/context/Cliente/core/exceptions/ClienteNotFoundError';
import { ClienteProfileDto } from 'src/context/Cliente/application/dtos/ClienteProfileDto'; // ajusta según tu estructura
import { ClienteGetProfile } from '../../../use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { Categoria } from 'src/context/Cliente/core/entities/Categoria';
import { CategoriaId } from 'src/context/Cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from 'src/context/Cliente/core/value-objects/CategoriaNombre';
import { Cliente } from 'src/context/Cliente/core/entities/Cliente';
import { ClienteDni } from 'src/context/Cliente/core/value-objects/ClienteDni';
import { ClienteNombre } from 'src/context/Cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from 'src/context/Cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from 'src/context/Cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from 'src/context/Cliente/core/value-objects/ClienteFechaNacimiento';
import {
  ClienteStatus,
  StatusCliente,
} from 'src/context/Cliente/core/value-objects/ClienteStatus';
import { ClienteEmail } from 'src/context/Cliente/core/value-objects/ClienteEmail';
import { ClienteTelefono } from 'src/context/Cliente/core/value-objects/ClienteTelefono';
import { ClienteDireccion } from 'src/context/Cliente/core/value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from 'src/context/Cliente/core/value-objects/ClienteCodPostal';
import { ClienteLocalidad } from 'src/context/Cliente/core/value-objects/ClienteLocalidad';
import { ClienteProvincia } from 'src/context/Cliente/core/value-objects/ClienteProvincia';
import { ClienteIdFidely } from 'src/context/Cliente/core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from 'src/context/Cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteFechaBaja } from 'src/context/Cliente/core/value-objects/ClienteFechaBaja';

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
      new CategoriaId('cat-1'),
      new CategoriaNombre('Gold'),
    );
    const clienteDom = new Cliente(
      new ClienteId('c-123'),
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
      id: 'c-123',
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
    expect(repoMock.findById).toHaveBeenCalledWith(new ClienteId('c-123'));
    expect(puntosMock.obtenerSaldoActual).toHaveBeenCalledWith('c-123');
  });
});
