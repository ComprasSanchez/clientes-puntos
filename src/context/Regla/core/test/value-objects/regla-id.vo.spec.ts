import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { ReglaId } from '../../value-objects/ReglaId';

describe('ReglaId', () => {
  it('debe crear un ReglaId válido', () => {
    const id = new ReglaId('123e4567-e89b-12d3-a456-426614174000');
    expect(id.toString()).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('lanza FieldRequiredError si value es vacío', () => {
    expect(() => new ReglaId('')).toThrow(FieldRequiredError);
  });
});
