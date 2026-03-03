import { Sucursal } from '../../entities/Sucursal';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

describe('Sucursal', () => {
  it('crea una sucursal con id generado', () => {
    const uuidGen: UUIDGenerator = {
      generate: jest
        .fn()
        .mockReturnValue('00000000-0000-4000-8000-000000000001'),
    };

    const sucursal = Sucursal.crear(uuidGen, '001', 'Casa Central');

    expect(sucursal.id).toBe('00000000-0000-4000-8000-000000000001');
    expect(sucursal.codigo).toBe('001');
    expect(sucursal.nombre).toBe('Casa Central');
    expect(uuidGen.generate).toHaveBeenCalledTimes(1);
  });

  it('rehidrata una sucursal sin generar id', () => {
    const sucursal = Sucursal.rehidratar(
      '00000000-0000-4000-8000-000000000002',
      '002',
      'Sucursal Norte',
    );

    expect(sucursal.id).toBe('00000000-0000-4000-8000-000000000002');
    expect(sucursal.codigo).toBe('002');
    expect(sucursal.nombre).toBe('Sucursal Norte');
  });

  it('permite cambiar codigo y nombre', () => {
    const sucursal = Sucursal.rehidratar(
      '00000000-0000-4000-8000-000000000003',
      '003',
      'Sucursal Sur',
    );

    sucursal.cambiarCodigo('099');
    sucursal.cambiarNombre('Sucursal Sur Renovada');

    expect(sucursal.codigo).toBe('099');
    expect(sucursal.nombre).toBe('Sucursal Sur Renovada');
  });
});
