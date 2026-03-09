import { Cliente } from '../../entities/Cliente';
import { ClienteDni } from '../../value-objects/ClienteDni';
import { ClienteFechaAlta } from '../../value-objects/ClienteFechaAlta';
import { ClienteId } from '../../value-objects/ClienteId';
import { ClienteIdFidely } from '../../value-objects/ClienteIdFidely';
import { ClienteStatus } from '../../value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../../value-objects/ClienteTarjetaFidely';
import { fakeCategoria } from './FakeCategoria';

export const fakeCliente = new Cliente({
  id: new ClienteId('00000000-0000-0000-0000-000000000001'),
  dni: new ClienteDni('12345678'),
  status: new ClienteStatus('activo'),
  categoria: fakeCategoria,
  tarjetaFidely: new ClienteTarjetaFidely('2222222222222222'),
  idFidely: new ClienteIdFidely(1111111111),
  fechaAlta: new ClienteFechaAlta(new Date('1990-01-01')),
});
