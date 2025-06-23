import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { UUIDv4Generator } from './UuidV4Generator';

describe('UUIDv4Generator', () => {
  let generator: UUIDv4Generator;

  beforeAll(() => {
    generator = new UUIDv4Generator();
  });

  it('genera un string', () => {
    const id = generator.generate();
    expect(typeof id).toBe('string');
  });

  it('genera un UUID con formato válido', () => {
    const id = generator.generate();
    expect(uuidValidate(id)).toBe(true);
  });

  it('genera un UUID de versión 4', () => {
    const id = generator.generate();
    expect(uuidVersion(id)).toBe(4);
  });

  it('genera valores distintos en llamadas sucesivas', () => {
    const ids = Array.from({ length: 5 }, () => generator.generate());
    const uniq = new Set(ids);
    expect(uniq.size).toBe(5);
  });
});
