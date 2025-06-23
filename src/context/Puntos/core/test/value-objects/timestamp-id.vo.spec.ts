import { TimestampId } from '../../value-objects/TimestampId';

describe('TimestampId VO', () => {
  it('create() produce una instancia con valor numérico', () => {
    const t1 = TimestampId.create();
    expect(typeof t1.value).toBe('number');
    expect(t1.value).toBeGreaterThan(0);
  });

  it('get value devuelve el número interno', () => {
    const custom = new TimestampId(123456);
    expect(custom.value).toBe(123456);
  });
});
