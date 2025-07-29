import { Cliente } from '../../entities/Cliente';
import { ClienteApellido } from '../../value-objects/ClienteApellido';
import { ClienteCodigoPostal } from '../../value-objects/ClienteCodPostal';
import { ClienteDireccion } from '../../value-objects/ClienteDireccion';
import { ClienteDni } from '../../value-objects/ClienteDni';
import { ClienteEmail } from '../../value-objects/ClienteEmail';
import { ClienteFechaBaja } from '../../value-objects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from '../../value-objects/ClienteFechaNacimiento';
import { ClienteId } from '../../value-objects/ClienteId';
import { ClienteIdFidely } from '../../value-objects/ClienteIdFidely';
import { ClienteLocalidad } from '../../value-objects/ClienteLocalidad';
import { ClienteNombre } from '../../value-objects/ClienteNombre';
import { ClienteProvincia } from '../../value-objects/ClienteProvincia';
import { ClienteSexo } from '../../value-objects/ClienteSexo';
import { ClienteStatus } from '../../value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../../value-objects/ClienteTarjetaFidely';
import { ClienteTelefono } from '../../value-objects/ClienteTelefono';
import { fakeCategoria } from './FakeCategoria';

export const fakeCliente = new Cliente(
  new ClienteId('00000000-0000-0000-0000-000000000001'),
  new ClienteDni('12345678'),
  new ClienteNombre('Juan'),
  new ClienteApellido('Pérez'),
  new ClienteSexo('M'),
  new ClienteFechaNacimiento(new Date('1990-01-01')),
  new ClienteStatus('activo'),
  fakeCategoria,
  new ClienteTarjetaFidely('2222222222222222'),
  new ClienteIdFidely(1111111111),
  new ClienteEmail('juan.perez@example.com'),
  new ClienteTelefono('555-1234'),
  new ClienteDireccion('Calle Falsa 123'),
  new ClienteCodigoPostal('1000'),
  new ClienteLocalidad('Ciudad'),
  new ClienteProvincia('Provincia'),
  new ClienteFechaBaja(null),
);
